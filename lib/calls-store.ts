import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { pgListAllCalls, pgUpsertCall } from "@/lib/calls-pg";
import type { CallRecord } from "./types";
import { enrichCallRecordForDisplay } from "./enrich-call-display-sync";
import { userCallsDbPath } from "./call-storage-paths";
import {
  isSeededSampleCallId,
  resolveCanonicalCallDetailId,
} from "./hackathon-sample-manifest";
import { MOCK_CALLS } from "./mock-data";

const memory = new Map<string, CallRecord>();
let mocksSeeded = false;

export function usesPostgres(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function ensureMocksInMemory() {
  if (mocksSeeded) return;
  for (const c of MOCK_CALLS) {
    memory.set(c.id, { ...c });
  }
  mocksSeeded = true;
}

function clearUserRecordsFromMemory() {
  for (const key of [...memory.keys()]) {
    if (!isSeededSampleCallId(key)) {
      memory.delete(key);
    }
  }
}

function loadUserRecordsFromDisk() {
  const dbPath = userCallsDbPath();
  if (!fs.existsSync(dbPath)) return;
  try {
    const raw = JSON.parse(fs.readFileSync(dbPath, "utf8")) as {
      records?: CallRecord[];
    };
    for (const c of raw.records ?? []) {
      if (c?.id && typeof c.id === "string") {
        memory.set(c.id, c as CallRecord);
      }
    }
  } catch {
    /* ignore corrupt DB */
  }
}

async function loadUserRecordsIntoMemory() {
  clearUserRecordsFromMemory();
  if (usesPostgres()) {
    try {
      const rows = await pgListAllCalls();
      for (const c of rows) {
        memory.set(c.id, c);
      }
    } catch (e) {
      console.error(
        "[calls-store] PostgreSQL read failed; using data/user-calls.json instead.",
        e instanceof Error ? e.message : e,
      );
      loadUserRecordsFromDisk();
    }
  } else {
    loadUserRecordsFromDisk();
  }
}

function persistUserCallsToJsonFile() {
  const dbPath = userCallsDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const records = Array.from(memory.values()).filter(
    (c) => !isSeededSampleCallId(c.id),
  );
  fs.writeFileSync(
    dbPath,
    JSON.stringify({ version: 1, records }, null, 2),
    "utf8",
  );
}

/** @deprecated use listCalls flow */
export async function seedMockIfEmpty() {
  ensureMocksInMemory();
  await loadUserRecordsIntoMemory();
}

export async function listCalls(): Promise<CallRecord[]> {
  ensureMocksInMemory();
  await loadUserRecordsIntoMemory();
  return Array.from(memory.values())
    .map((c) => enrichCallRecordForDisplay(c))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getCall(id: string): Promise<CallRecord | undefined> {
  ensureMocksInMemory();
  await loadUserRecordsIntoMemory();
  const resolved = resolveCanonicalCallDetailId(id);
  const c = memory.get(resolved);
  return c ? enrichCallRecordForDisplay(c) : undefined;
}

export async function upsertCall(record: CallRecord): Promise<void> {
  ensureMocksInMemory();
  memory.set(record.id, record);
  if (usesPostgres()) {
    try {
      await pgUpsertCall(record);
    } catch (e) {
      console.error(
        "[calls-store] PostgreSQL write failed; saved to data/user-calls.json.",
        e instanceof Error ? e.message : e,
      );
      persistUserCallsToJsonFile();
    }
  } else {
    persistUserCallsToJsonFile();
  }
  try {
    revalidatePath("/");
    revalidatePath(`/call-detail/${record.id}`);
    revalidatePath(`/calls/${record.id}`);
  } catch {
    /* revalidatePath is server-only */
  }
}

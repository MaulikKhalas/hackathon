import fs from "node:fs";
import { NextResponse } from "next/server";
import { pgExportUserCallsPayload } from "@/lib/calls-pg";
import { usesPostgres } from "@/lib/calls-store";
import { userCallsDbPath } from "@/lib/call-storage-paths";

export const runtime = "nodejs";

/**
 * User-uploaded calls only (same payload shape as legacy `data/user-calls.json`).
 * With `DATABASE_URL`, reads PostgreSQL; otherwise the JSON file on disk.
 * For the full merged list including hackathon demos, use GET `/api/calls`.
 */
export async function GET() {
  if (usesPostgres()) {
    try {
      const payload = await pgExportUserCallsPayload();
      if (payload.records.length === 0) {
        return NextResponse.json(
          {
            message: "No rows yet — upload a call to create one.",
            store: "postgresql:call_records",
          },
          { status: 404 },
        );
      }
      return NextResponse.json(payload);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Database error";
      return NextResponse.json({ error: msg, store: "postgresql" }, { status: 500 });
    }
  }

  const dbPath = userCallsDbPath();
  if (!fs.existsSync(dbPath)) {
    return NextResponse.json(
      {
        message: "No file yet — upload a call to create it.",
        path: "data/user-calls.json",
      },
      { status: 404 },
    );
  }
  const raw = fs.readFileSync(dbPath, "utf8");
  try {
    const parsed = JSON.parse(raw) as unknown;
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "Stored file is not valid JSON", path: "data/user-calls.json" },
      { status: 500 },
    );
  }
}

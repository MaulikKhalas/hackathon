import { getPgPool } from "@/lib/db";
import type { CallRecord } from "@/lib/types";

let tableEnsured = false;

export async function ensureCallRecordsTable(): Promise<void> {
  if (tableEnsured) return;
  const pool = getPgPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS call_records (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS call_records_created_at_idx
    ON call_records (created_at DESC);
  `);
  tableEnsured = true;
}

export async function pgListAllCalls(): Promise<CallRecord[]> {
  await ensureCallRecordsTable();
  const pool = getPgPool();
  const res = await pool.query<{ data: CallRecord }>(
    `SELECT data FROM call_records ORDER BY created_at DESC`,
  );
  return res.rows.map((r) => r.data as CallRecord);
}

export async function pgUpsertCall(record: CallRecord): Promise<void> {
  await ensureCallRecordsTable();
  const pool = getPgPool();
  const createdAt = new Date(record.createdAt);
  await pool.query(
    `INSERT INTO call_records (id, data, created_at)
     VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
    [record.id, record as object, createdAt.toISOString()],
  );
}

/** Same shape as the legacy JSON file, for `/api/data/user-calls`. */
export async function pgExportUserCallsPayload(): Promise<{
  version: 1;
  records: CallRecord[];
}> {
  const records = await pgListAllCalls();
  return { version: 1, records };
}

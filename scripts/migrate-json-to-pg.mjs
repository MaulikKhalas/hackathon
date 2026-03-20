/**
 * One-off: copy `data/user-calls.json` into PostgreSQL.
 * Usage: DATABASE_URL=... node scripts/migrate-json-to-pg.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const jsonPath = path.join(root, "data", "user-calls.json");

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("Set DATABASE_URL (e.g. postgresql://user:pass@localhost:5432/callaura)");
  process.exit(1);
}

if (!fs.existsSync(jsonPath)) {
  console.log("No file at data/user-calls.json — nothing to migrate.");
  process.exit(0);
}

const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const records = Array.isArray(raw.records) ? raw.records : [];

const pool = new pg.Pool({ connectionString: url });
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

let n = 0;
for (const rec of records) {
  if (!rec?.id) continue;
  const createdAt = new Date(rec.createdAt || Date.now()).toISOString();
  await pool.query(
    `INSERT INTO call_records (id, data, created_at)
     VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
    [rec.id, rec, createdAt],
  );
  n += 1;
}

await pool.end();
console.log(`Migrated ${n} record(s) into call_records.`);

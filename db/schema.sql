-- CallAura AI: user-uploaded call payloads (mirrors legacy JSON file rows).
-- The app also runs `CREATE TABLE IF NOT EXISTS` on first use.

CREATE TABLE IF NOT EXISTS call_records (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS call_records_created_at_idx
  ON call_records (created_at DESC);

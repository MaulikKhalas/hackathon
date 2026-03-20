import { Pool } from "pg";

let pool: Pool | null = null;

export function getPgPool(): Pool {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!pool) {
    pool = new Pool({ connectionString: url, max: 10 });
  }
  return pool;
}

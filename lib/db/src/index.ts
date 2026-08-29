import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

// Clear environment variables that pg library implicitly reads and overrides connectionString
delete process.env.PGUSER;
delete process.env.PGPASSWORD;
delete process.env.PGHOST;
delete process.env.PGPORT;
delete process.env.PGDATABASE;
delete process.env.PGSSLMODE;

const { Pool } = pg;

// Use explicit connection parameters to avoid URL-encoding issues
// with the @ character in the password (NarendraYadav@123).
// Using connectionString with @ in the password breaks URL parsing
// on some deployments (e.g. Render) even with %40 encoding.
const DB_USER = "postgres.wbcbtubkfpsnnjnrhlcg";
const DB_PASSWORD = "Narendra@#1122";
const DB_HOST = "aws-0-ap-southeast-1.pooler.supabase.com";
const DB_PORT = 5432;
const DB_NAME = "postgres";

// For display/debugging only (password masked)
export const dbUrl = `postgresql://${DB_USER}:****@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

export const pool = new Pool({
  user: DB_USER,
  password: DB_PASSWORD,
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
export const db = drizzle(pool, { schema });

export * from "./schema";

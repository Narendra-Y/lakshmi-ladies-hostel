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

export let dbUrl = process.env.DATABASE_URL;

if (!dbUrl || !dbUrl.includes("drdwrkpbynivpxumqpkj")) {
  dbUrl = "postgresql://postgres.drdwrkpbynivpxumqpkj:NarendraYadav%40123@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";
}

if (dbUrl.includes("NarendraYadav@123")) {
  dbUrl = dbUrl.replace("NarendraYadav@123", "NarendraYadav%40123");
}

export const pool = new Pool({ connectionString: dbUrl });
export const db = drizzle(pool, { schema });

export * from "./schema";

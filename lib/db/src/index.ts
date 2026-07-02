import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let dbUrl = process.env.DATABASE_URL || "postgresql://postgres.drdwrkpbynivpxumqpkj:NarendraYadav%40123@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";

if (dbUrl.includes("NarendraYadav@123")) {
  dbUrl = dbUrl.replace("NarendraYadav@123", "NarendraYadav%40123");
}

export const pool = new Pool({ connectionString: dbUrl });
export const db = drizzle(pool, { schema });

export * from "./schema";

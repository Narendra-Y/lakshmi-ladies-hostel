import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db, adminsTable, dbUrl } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok", version: "raw-pg" });
});

router.get("/test-db", async (_req, res) => {
  const mask = (str: string) => str ? str.replace(/:([^:@]+)@/, ":****@") : "";
  const pg = require('pg');
  const testPool = new pg.Pool({ connectionString: dbUrl });
  try {
    const testRes = await testPool.query('SELECT NOW()');
    res.json({ status: "success", pg: testRes.rows[0], urlUsed: mask(dbUrl) });
  } catch (err) {
    const pgErr = err as any;
    res.status(500).json({ 
      status: "error", 
      message: err instanceof Error ? err.message : String(err), 
      code: pgErr.code,
      detail: pgErr.detail,
      originalError: pgErr.originalError?.message || pgErr.cause?.message || pgErr.message,
      urlUsed: mask(dbUrl),
      envDatabaseUrl: mask(process.env.DATABASE_URL || "")
    });
  } finally {
    await testPool.end();
  }
});

export default router;

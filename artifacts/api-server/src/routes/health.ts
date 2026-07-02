import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db, adminsTable, dbUrl } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok", version: "debug-url" });
});

router.get("/test-db", async (_req, res) => {
  const mask = (str: string) => str ? str.replace(/:([^:@]+)@/, ":****@") : "";
  try {
    const result = await db.select().from(adminsTable);
    res.json({ status: "success", count: result.length, urlUsed: mask(dbUrl) });
  } catch (err) {
    const pgErr = err as any;
    res.status(500).json({ 
      status: "error", 
      message: err instanceof Error ? err.message : String(err), 
      code: pgErr.code,
      detail: pgErr.detail,
      originalError: pgErr.originalError?.message || pgErr.cause?.message || pgErr.message,
      urlUsed: mask(dbUrl),
      envDatabaseUrl: mask(process.env.DATABASE_URL || ""),
      stack: err instanceof Error ? err.stack : undefined 
    });
  }
});

export default router;

import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db, adminsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok", version: "66d313a" });
});

router.get("/test-db", async (_req, res) => {
  try {
    const result = await db.select().from(adminsTable);
    res.json({ status: "success", count: result.length });
  } catch (err) {
    const pgErr = err as any;
    res.status(500).json({ 
      status: "error", 
      message: err instanceof Error ? err.message : String(err), 
      code: pgErr.code,
      detail: pgErr.detail,
      originalError: pgErr.originalError?.message || pgErr.cause?.message || pgErr.message,
      stack: err instanceof Error ? err.stack : undefined 
    });
  }
});

export default router;

import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db, adminsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/test-db", async (_req, res) => {
  try {
    const result = await db.select().from(adminsTable);
    res.json({ status: "success", count: result.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ 
      status: "error", 
      message, 
      stack: err instanceof Error ? err.stack : undefined 
    });
  }
});

export default router;

import { Router, type IRouter } from "express";
import { db, registrationsTable } from "@workspace/db";
import { eq, ilike, and, sql, gte, lte, or, count } from "drizzle-orm";
import {
  CreateRegistrationBody,
  ListRegistrationsQueryParams,
  GetRegistrationParams,
  DeleteRegistrationParams,
  UpdateRegistrationStatusParams,
  UpdateRegistrationStatusBody,
  UpdatePaymentStatusParams,
  UpdatePaymentStatusBody,
  GetRegistrationResponse,
  ListRegistrationsResponse,
  GetRegistrationStatsResponse,
  UpdateRegistrationStatusResponse,
  UpdatePaymentStatusResponse,
  GetPaymentRemindersResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/registrations", async (req, res): Promise<void> => {
  // Sanitize empty strings for optional fields
  if (req.body.email === "") delete req.body.email;
  if (req.body.notes === "") delete req.body.notes;
  if (req.body.photoUrl === "") delete req.body.photoUrl;
  if (req.body.idProofUrl === "") delete req.body.idProofUrl;

  const parsed = CreateRegistrationBody.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    res.status(400).json({ error: errorMsg });
    return;
  }

  try {
    const existing = await db
      .select({ id: registrationsTable.id })
      .from(registrationsTable)
      .where(eq(registrationsTable.mobileNumber, parsed.data.mobileNumber));

    if (existing.length > 0) {
      res.status(409).json({ error: "This mobile number is already registered with us." });
      return;
    }

  const dob = parsed.data.dateOfBirth instanceof Date
    ? parsed.data.dateOfBirth.toISOString().split("T")[0]
    : String(parsed.data.dateOfBirth);

  const [reg] = await db
    .insert(registrationsTable)
    .values({
      fullName: parsed.data.fullName,
      mobileNumber: parsed.data.mobileNumber,
      dateOfBirth: dob,
      email: parsed.data.email ?? null,
      gender: parsed.data.gender,
      profession: parsed.data.profession,
      guardianName: parsed.data.guardianName,
      guardianMobile: parsed.data.guardianMobile,
      address: parsed.data.address,
      notes: parsed.data.notes ?? null,
      photoUrl: parsed.data.photoUrl ?? null,
      idProofUrl: parsed.data.idProofUrl ?? null,
    })
    .returning();

    res.status(201).json(GetRegistrationResponse.parse(reg));
  } catch (err: any) {
    console.error("Error creating registration:", err);
    res.status(500).json({ error: err.message || "Database error while saving registration" });
  }
});

router.get("/registrations/stats", requireAuth, async (_req: AuthRequest, res): Promise<void> => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalResult] = await db.select({ value: count() }).from(registrationsTable);
  const [pendingResult] = await db
    .select({ value: count() })
    .from(registrationsTable)
    .where(eq(registrationsTable.status, "pending"));
  const [approvedResult] = await db
    .select({ value: count() })
    .from(registrationsTable)
    .where(eq(registrationsTable.status, "approved"));
  const [rejectedResult] = await db
    .select({ value: count() })
    .from(registrationsTable)
    .where(eq(registrationsTable.status, "rejected"));
  const [todayResult] = await db
    .select({ value: count() })
    .from(registrationsTable)
    .where(gte(registrationsTable.createdAt, todayStart));
  const [weekResult] = await db
    .select({ value: count() })
    .from(registrationsTable)
    .where(gte(registrationsTable.createdAt, weekStart));
  const [monthResult] = await db
    .select({ value: count() })
    .from(registrationsTable)
    .where(gte(registrationsTable.createdAt, monthStart));

  res.json(
    GetRegistrationStatsResponse.parse({
      total: Number(totalResult.value),
      pending: Number(pendingResult.value),
      approved: Number(approvedResult.value),
      rejected: Number(rejectedResult.value),
      todayCount: Number(todayResult.value),
      thisWeekCount: Number(weekResult.value),
      thisMonthCount: Number(monthResult.value),
    })
  );
});

router.get("/registrations", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const queryParsed = ListRegistrationsQueryParams.safeParse(req.query);
  if (!queryParsed.success) {
    res.status(400).json({ error: queryParsed.error.message });
    return;
  }

  const { status, search, page = 1, limit = 20 } = queryParsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) {
    conditions.push(eq(registrationsTable.status, status));
  }
  if (search) {
    conditions.push(
      or(
        ilike(registrationsTable.fullName, `%${search}%`),
        ilike(registrationsTable.mobileNumber, `%${search}%`),
        ilike(registrationsTable.profession, `%${search}%`),
        ilike(registrationsTable.email, `%${search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ value: count() })
    .from(registrationsTable)
    .where(whereClause);

  const data = await db
    .select()
    .from(registrationsTable)
    .where(whereClause)
    .orderBy(sql`${registrationsTable.createdAt} desc`)
    .limit(limit)
    .offset(offset);

  const total = Number(totalResult.value);
  const totalPages = Math.ceil(total / limit);

  res.json(
    ListRegistrationsResponse.parse({
      data,
      total,
      page,
      limit,
      totalPages,
    })
  );
});

router.get("/registrations/reminders", requireAuth, async (_req: AuthRequest, res): Promise<void> => {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const tenants = await db
    .select()
    .from(registrationsTable)
    .where(eq(registrationsTable.status, "approved"));

  const today: object[] = [];
  const upcoming: object[] = [];
  const overdue: object[] = [];

  for (const tenant of tenants) {
    if (!tenant.nextPaymentDate) continue;
    const due = new Date(tenant.nextPaymentDate);
    const diffMs = due.getTime() - new Date(todayStr).getTime();
    const daysUntilDue = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const item = {
      id: tenant.id,
      fullName: tenant.fullName,
      mobileNumber: tenant.mobileNumber,
      email: tenant.email ?? null,
      joiningDate: tenant.joiningDate ?? null,
      nextPaymentDate: tenant.nextPaymentDate ?? null,
      paymentStatus: tenant.paymentStatus ?? null,
      daysUntilDue,
    };

    if (daysUntilDue === 0) {
      today.push(item);
    } else if (daysUntilDue > 0 && daysUntilDue <= 30) {
      upcoming.push(item);
    } else if (daysUntilDue < 0) {
      overdue.push(item);
    }
  }

  res.json(GetPaymentRemindersResponse.parse({ today, upcoming, overdue }));
});

router.patch("/registrations/:id/payment", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdatePaymentStatusParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const bodyParsed = UpdatePaymentStatusBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(registrationsTable)
    .where(eq(registrationsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Registration not found" });
    return;
  }

  let nextPaymentDate = existing.nextPaymentDate;
  if (bodyParsed.data.paymentStatus === "paid" && existing.joiningDate) {
    const lastPayment = existing.nextPaymentDate
      ? new Date(existing.nextPaymentDate)
      : new Date(existing.joiningDate);
    const next = new Date(lastPayment);
    next.setMonth(next.getMonth() + 1);
    nextPaymentDate = next.toISOString().split("T")[0];
  }

  const [reg] = await db
    .update(registrationsTable)
    .set({ paymentStatus: bodyParsed.data.paymentStatus, nextPaymentDate })
    .where(eq(registrationsTable.id, params.data.id))
    .returning();

  res.json(UpdatePaymentStatusResponse.parse(reg));
});

router.get("/registrations/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetRegistrationParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [reg] = await db
    .select()
    .from(registrationsTable)
    .where(eq(registrationsTable.id, params.data.id));

  if (!reg) {
    res.status(404).json({ error: "Registration not found" });
    return;
  }

  res.json(GetRegistrationResponse.parse(reg));
});

router.patch("/registrations/:id/status", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateRegistrationStatusParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const bodyParsed = UpdateRegistrationStatusBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const [reg] = await db
    .update(registrationsTable)
    .set({ status: bodyParsed.data.status })
    .where(eq(registrationsTable.id, params.data.id))
    .returning();

  if (!reg) {
    res.status(404).json({ error: "Registration not found" });
    return;
  }

  res.json(UpdateRegistrationStatusResponse.parse(reg));
});

router.delete("/registrations/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteRegistrationParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [reg] = await db
    .delete(registrationsTable)
    .where(eq(registrationsTable.id, params.data.id))
    .returning();

  if (!reg) {
    res.status(404).json({ error: "Registration not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

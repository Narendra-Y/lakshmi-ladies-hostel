import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, adminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { AdminLoginBody, AdminLoginResponse, GetAdminMeResponse } from "@workspace/api-zod";
import { requireAuth, signToken, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.email, email));
  if (!admin) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken(admin.id, admin.email);

  res.json(
    AdminLoginResponse.parse({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    })
  );
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.id, req.adminId!));
  if (!admin) {
    res.status(401).json({ error: "Admin not found" });
    return;
  }
  res.json(GetAdminMeResponse.parse({ id: admin.id, email: admin.email, name: admin.name }));
});

export default router;

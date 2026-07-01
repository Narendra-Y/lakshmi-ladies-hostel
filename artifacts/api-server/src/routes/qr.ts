import { Router, type IRouter } from "express";
import QRCode from "qrcode";
import { GetQrCodeResponse } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/qr", requireAuth, async (_req: AuthRequest, res): Promise<void> => {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost";
  const registrationUrl = domain.startsWith("localhost")
    ? `http://localhost/register`
    : `https://${domain}/register`;

  const qrCode = await QRCode.toDataURL(registrationUrl, {
    width: 400,
    margin: 2,
    color: { dark: "#4a1942", light: "#ffffff" },
  });

  res.json(GetQrCodeResponse.parse({ qrCode, registrationUrl }));
});

export default router;

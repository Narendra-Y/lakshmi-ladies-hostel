import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import registrationsRouter from "./registrations";
import uploadsRouter from "./uploads";
import qrRouter from "./qr";
import roomsRouter from "./rooms";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(registrationsRouter);
router.use(uploadsRouter);
router.use(qrRouter);
router.use(roomsRouter);

export default router;

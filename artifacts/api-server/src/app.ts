import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Replit (and most cloud hosts) run behind a reverse proxy — trust it
// so express-rate-limit can read the real client IP from X-Forwarded-For
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many registration attempts from this IP. Please try again later." },
});

app.use("/api", globalLimiter);
app.use("/api/auth/login", loginLimiter);
app.use("/api/registrations", (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === "POST") {
    registrationLimiter(req, res, next);
    return;
  }
  next();
});

app.use("/api", router);

app.use("/api/*path", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint not found" });
});

export default app;

import express from "express";
import authRoutes from "./routes/auth.routes";
import tradeRoutes from "./routes/trade.routes";
import cors from "cors";

const app = express();

const requestLog = new Map<string, number[]>();
const createRateLimiter =
  (windowMs: number, maxRequests: number) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const cutoff = now - windowMs;
    const history = (requestLog.get(key) ?? []).filter((ts) => ts >= cutoff);

    if (history.length >= maxRequests) {
      return res.status(429).json({ message: "Too many requests" });
    }

    history.push(now);
    requestLog.set(key, history);
    next();
  };

app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.use("/auth", createRateLimiter(60_000, 20), authRoutes);
app.use("/trade", createRateLimiter(60_000, 60), tradeRoutes);

export default app;

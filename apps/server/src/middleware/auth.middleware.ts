import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import Redis from "ioredis";

const redis = new Redis();

export interface AuthRequest extends Request {
  userId?: string;
  token?: string;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const revoked = await redis.get(`revoked_token:${token}`);
    if (revoked) {
      return res.status(401).json({ message: "Token revoked" });
    }

    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.token = token;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

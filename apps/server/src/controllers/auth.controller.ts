import type { Request, Response } from "express";
import { prisma } from "@repo/database";
import { generateToken } from "../utils/jwt";
import type { AuthRequest } from "../middleware/auth.middleware";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import { verifyMagicDidToken } from "../services/magic.service";

const redis = new Redis();

const normalizeEmail = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
};

/**
 * Magic Express + OTP: email often appears in `user_data` from Magic’s auth APIs,
 * not in the DID claim or `/v1/admin/user`. After `token.validate()`, we accept
 * `email` from the client (same address used for OTP). If the admin API returns
 * email, it must match the client when both are present.
 */
export const verifyMagicAuth = async (req: Request, res: Response) => {
  const { didToken, email: bodyEmailRaw } = req.body as {
    didToken?: unknown;
    email?: unknown;
  };

  if (typeof didToken !== "string" || didToken.length < 20) {
    return res.status(400).json({ message: "Invalid DID token" });
  }

  try {
    const metadata = await verifyMagicDidToken(didToken);
    const fromAdmin = metadata.email?.trim().toLowerCase() ?? null;
    const fromClient = normalizeEmail(bodyEmailRaw);

    let email: string | null = fromAdmin;
    if (fromAdmin && fromClient && fromAdmin !== fromClient) {
      return res.status(401).json({ message: "Email does not match this Magic session" });
    }
    if (!fromAdmin && fromClient) {
      email = fromClient;
    }
    if (!email) {
      return res.status(400).json({
        message:
          "Missing email: include the same address you used for OTP in the request body (Magic Express does not always expose it on the DID alone).",
      });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          password: null,
          balance: {
            create: {
              amount: 10000,
            },
          },
        },
      });
    }

    const jwtToken = generateToken(user.id);

    return res.status(200).json({ token: jwtToken });
  } catch {
    return res.status(401).json({
      message: "Magic authentication failed",
    });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  if (!req.token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const decoded = jwt.decode(req.token) as { exp?: number } | null;
  const exp = decoded?.exp;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const ttlSeconds = typeof exp === "number" ? Math.max(exp - nowInSeconds, 1) : 3600;

  try {
    await redis.set(`revoked_token:${req.token}`, "1", "EX", ttlSeconds);
    return res.status(200).json({ message: "Logged out successfully" });
  } catch {
    return res.status(503).json({ message: "Unable to process logout" });
  }
};

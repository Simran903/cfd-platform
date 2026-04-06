import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import Redis from "ioredis";
import crypto from "crypto";

const redis = new Redis();

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isValidTradeSide = (value: unknown): value is "LONG" | "SHORT" =>
  value === "LONG" || value === "SHORT";

export const openTrade = async (req: AuthRequest, res: Response) => {
  const { assetId, side, leverage, quantity, price } = req.body as {
    assetId?: unknown;
    side?: unknown;
    leverage?: unknown;
    quantity?: unknown;
    price?: unknown;
  };

  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (
    typeof assetId !== "string" ||
    assetId.trim() === "" ||
    !isValidTradeSide(side) ||
    !isPositiveNumber(leverage) ||
    !Number.isInteger(leverage) ||
    !isPositiveNumber(quantity) ||
    !isPositiveNumber(price)
  ) {
    return res.status(400).json({ message: "Invalid trade payload" });
  }

  const trade = {
    id: crypto.randomUUID(),
    userId: req.userId,
    assetId: assetId.trim().toUpperCase(),
    side,
    leverage,
    quantity,
    entryPrice: price,
    createdAt: Date.now(),
  };

  try {
    await redis.rpush("TRADE_QUEUE", JSON.stringify(trade));
  } catch {
    return res.status(503).json({ message: "Unable to queue trade" });
  }

  res.status(201).json({
    message: "Trade submitted",
    trade,
  });
};

export const closeTrade = async (req: AuthRequest, res: Response) => {
  const { tradeId } = req.body as { tradeId?: unknown };
  if (typeof tradeId !== "string" || tradeId.trim() === "") {
    return res.status(400).json({ message: "tradeId is required" });
  }

  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await redis.rpush(
      "CLOSE_TRADE_QUEUE",
      JSON.stringify({
        tradeId: tradeId.trim(),
        userId: req.userId,
        closedAt: Date.now(),
      }),
    );
  } catch {
    return res.status(503).json({ message: "Unable to queue close request" });
  }

  res.status(200).json({
    message: "Close trade request submitted",
  });
};

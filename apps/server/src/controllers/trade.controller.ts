import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import Redis from "ioredis";
import crypto from "crypto";

const redis = new Redis();

export const openTrade = async (
  req: AuthRequest,
  res: Response
) => {
  // console.log("OPEN TRADE API HIT");
  const { assetId, side, leverage, quantity, price } =
    req.body;

  const trade = {
    id: crypto.randomUUID(),
    userId: req.userId,
    assetId,
    side,
    leverage,
    quantity,
    entryPrice: price,
    createdAt: Date.now(),
  };

  // console.log("Sending trade to Redis");

  await redis.rpush(
    "TRADE_QUEUE",
    JSON.stringify(trade)
  );

  res.status(201).json({
    message: "Trade submitted",
    trade,
  });
};
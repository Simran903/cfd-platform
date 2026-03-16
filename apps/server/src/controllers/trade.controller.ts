import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import Redis from "ioredis";
import crypto from "crypto";

const redis = new Redis();

export const openTrade = async (req: AuthRequest, res: Response) => {
  // console.log("OPEN TRADE API HIT");
  const { assetId, side, leverage, quantity, price } = req.body;

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

  await redis.rpush("TRADE_QUEUE", JSON.stringify(trade));

  res.status(201).json({
    message: "Trade submitted",
    trade,
  });
};

export const closeTrade = async (req: AuthRequest, res: Response) => {
  const tradeId = req.body.tradeId;
  if (tradeId == null || tradeId === "") {
    return res.status(400).json({ message: "tradeId is required" });
  }

  await redis.rpush(
    "CLOSE_TRADE_QUEUE",
    JSON.stringify({
      tradeId,
      userId: req.userId,
      closedAt: Date.now(),
    }),
  );

  res.status(200).json({
    message: "Close trade request submitted",
  });
};

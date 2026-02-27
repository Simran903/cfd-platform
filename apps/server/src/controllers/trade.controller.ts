import type { Response } from "express";
import { prisma } from "@repo/database";
import type { AuthRequest } from "../middleware/auth.middleware";

export const openTrade = async (req: AuthRequest, res: Response) => {
  const { userId, assetId, side, leverage, quantity, price } = req.body;

  const trade = await prisma.trade.create({
    data: {
      userId: req.userId!,
      assetId,
      side,
      leverage,
      quantity,
      entryPrice: price,
    },
  });

  res.status(201).json(trade);
};

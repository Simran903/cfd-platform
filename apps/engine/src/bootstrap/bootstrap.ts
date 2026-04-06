import { prisma } from "@repo/database";
import { userStore } from "../stores/user.store";
import { tradeStore } from "../stores/trade.store";

export const bootstrapEngine = async () => {
  const users = await prisma.user.findMany({
    include: {
      balance: true,
    },
  });

  for (const user of users) {
    if (!user.balance) continue;

    userStore.set(user.id, user.balance.amount);
  }

  const trades = await prisma.trade.findMany({
    where: {
      status: "OPEN",
    },
    include: {
      asset: true,
    },
  });

  for (const trade of trades) {
    tradeStore.add({
      id: trade.id,
      userId: trade.userId,
      assetSymbol: trade.asset.symbol,
      side: trade.side as "LONG" | "SHORT",
      quantity: trade.quantity,
      leverage: trade.leverage,
      entryPrice: trade.entryPrice,
    });
  }
};

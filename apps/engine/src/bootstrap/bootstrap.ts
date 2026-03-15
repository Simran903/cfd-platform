import { prisma } from "@repo/database";
import { userStore } from "../stores/user.store";
import { tradeStore } from "../stores/trade.store";

export const bootstrapEngine = async () => {
  console.log("Bootstrapping engine...");

  // Load users with balance

  const users = await prisma.user.findMany({
    include: {
      balance: true,
    },
  });

  for (const user of users) {
    if (!user.balance) continue;

    userStore.set(user.id, user.balance.amount);
  }

  console.log("Loaded users:", users.length);

  // Load open trades

  const trades = await prisma.trade.findMany({
    where: {
      status: "OPEN",
    },
  });

  for (const trade of trades) {
    tradeStore.add({
      id: trade.id,
      userId: trade.userId,
      assetId: trade.assetId,
      side: trade.side as "LONG" | "SHORT",
      quantity: trade.quantity,
      leverage: trade.leverage,
      entryPrice: trade.entryPrice,
    });
  }

  console.log("Loaded trades:", trades.length);
};

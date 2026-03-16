import { redis } from "bun";
import { tradeStore } from "../stores/trade.store";
import { userStore } from "../stores/user.store";

export const executeTrade = async (trade: any) => {
  // Calculate required margin
  const margin = (trade.quantity * trade.entryPrice) / trade.leverage;

  const balance = userStore.get(trade.userId);

  // console.log("Trade received:", trade);
  //console.log("User balance:", balance);
  //console.log("Required margin:", margin);

  // Check balance
  if (!balance || balance.balance < margin) {
    console.log("Insufficient balance");
    return;
  }

  // Deduct margin
  userStore.updateBalance(trade.userId, -margin);

  // Store trade in engine memory
  tradeStore.add({
    id: trade.id,
    userId: trade.userId,
    assetId: trade.assetId,
    side: trade.side,
    leverage: trade.leverage,
    quantity: trade.quantity,
    entryPrice: trade.entryPrice,
  });

  // console.log("Trade executed:", trade.id);

  // Publish event for DB worker
  await redis.publish(
    "trade_events",
    JSON.stringify({
      type: "TRADE_OPENED",
      trade: {
        id: trade.id,
        userId: trade.userId,
        assetId: trade.assetId,
        side: trade.side,
        leverage: trade.leverage,
        quantity: trade.quantity,
        entryPrice: trade.entryPrice,
        createdAt: Date.now(),
      },
    })
  );
};
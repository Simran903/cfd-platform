import { redis } from "../redis/redis";
import { tradeStore } from "../stores/trade.store";
import { userStore } from "../stores/user.store";

type OpenTradePayload = {
  id: string;
  userId: string;
  assetId: string;
  side: "LONG" | "SHORT";
  leverage: number;
  quantity: number;
  entryPrice: number;
  createdAt?: number;
};

const isValidOpenTradePayload = (
  value: unknown,
): value is OpenTradePayload => {
  if (typeof value !== "object" || value === null) return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.id === "string" &&
    typeof payload.userId === "string" &&
    typeof payload.assetId === "string" &&
    (payload.side === "LONG" || payload.side === "SHORT") &&
    typeof payload.leverage === "number" &&
    Number.isInteger(payload.leverage) &&
    payload.leverage > 0 &&
    typeof payload.quantity === "number" &&
    Number.isFinite(payload.quantity) &&
    payload.quantity > 0 &&
    typeof payload.entryPrice === "number" &&
    Number.isFinite(payload.entryPrice) &&
    payload.entryPrice > 0
  );
};

export const executeTrade = async (payload: unknown) => {
  if (!isValidOpenTradePayload(payload)) {
    return;
  }

  const trade = payload;
  // Calculate required margin
  const margin = (trade.quantity * trade.entryPrice) / trade.leverage;

  const balance = userStore.get(trade.userId);

  // Check balance
  if (!balance || balance.balance < margin) {
    return;
  }

  // Deduct margin
  userStore.updateBalance(trade.userId, -margin);

  // Store trade in engine memory
  tradeStore.add({
    id: trade.id,
    userId: trade.userId,
    assetSymbol: trade.assetId,
    side: trade.side,
    leverage: trade.leverage,
    quantity: trade.quantity,
    entryPrice: trade.entryPrice,
  });

  const event = {
    type: "TRADE_OPENED" as const,
    userId: trade.userId,
    trade: {
      id: trade.id,
      userId: trade.userId,
      assetSymbol: trade.assetId,
      side: trade.side,
      leverage: trade.leverage,
      quantity: trade.quantity,
      entryPrice: trade.entryPrice,
      createdAt: trade.createdAt ?? Date.now(),
    },
  };

  await redis.publish("trade_events", JSON.stringify(event));
  await redis.rpush("DB_TRADE_EVENTS_QUEUE", JSON.stringify(event));
};
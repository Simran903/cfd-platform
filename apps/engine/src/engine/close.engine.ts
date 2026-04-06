import { redis } from "../redis/redis";
import { computeTradePnl } from "../services/pnl.service";
import { priceStore } from "../stores/price.store";
import { tradeStore } from "../stores/trade.store";
import { userStore } from "../stores/user.store";

type CloseTradePayload = {
  tradeId: string;
  userId: string;
  liquidated?: boolean;
};

const isValidClosePayload = (value: unknown): value is CloseTradePayload => {
  if (typeof value !== "object" || value === null) return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.tradeId === "string" &&
    typeof payload.userId === "string" &&
    (payload.liquidated === undefined || typeof payload.liquidated === "boolean")
  );
};

export const closeTrade = async (payload: unknown) => {
  if (!isValidClosePayload(payload)) {
    return;
  }

  const trade = tradeStore.get(payload.tradeId);

  if (!trade) {
    return;
  }

  if (trade.userId !== payload.userId) {
    return;
  }

  const currentPrice = priceStore.getPrice(trade.assetSymbol);
  if (currentPrice === undefined) {
    return;
  }

  const pnl = computeTradePnl(
    trade.side,
    trade.entryPrice,
    currentPrice,
    trade.quantity,
    trade.leverage,
  );

  const margin = (trade.quantity * trade.entryPrice) / trade.leverage;

  // Liquidation burns margin; normal close releases margin plus realized pnl.
  const balanceDelta = payload.liquidated ? pnl : margin + pnl;
  userStore.updateBalance(trade.userId, balanceDelta);

  tradeStore.remove(trade.id);

  const event = {
    type: payload.liquidated ? ("TRADE_LIQUIDATED" as const) : ("TRADE_CLOSED" as const),
    tradeId: trade.id,
    userId: trade.userId,
    pnl,
    exitPrice: currentPrice,
    closedAt: Date.now(),
  };

  await redis.publish("trade_events", JSON.stringify(event));
  await redis.rpush("DB_TRADE_EVENTS_QUEUE", JSON.stringify(event));
};
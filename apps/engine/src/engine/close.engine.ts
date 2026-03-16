import { redis } from "../redis/redis";
import { computeTradePnl } from "../services/pnl.service";
import { priceStore } from "../stores/price.store";
import { tradeStore } from "../stores/trade.store";
import { userStore } from "../stores/user.store";

export const closeTrade = async (payload: any) => {
  const trade = tradeStore.get(payload.tradeId);

  if (!trade) {
    console.log(`Trade ${payload.tradeId} not found`);
    return;
  }

  const currentPrice = priceStore.getPrice(trade.assetId);
  if (currentPrice === undefined) {
    console.log("No price for asset:", trade.assetId);
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

  // release margin + pnl
  userStore.updateBalance(trade.userId, margin + pnl);

  tradeStore.remove(trade.id);

  console.log("Trade closed:", trade.id);
  console.log("Realized PnL:", pnl);

  await redis.publish(
    "trade_events",
    JSON.stringify({
      type: "TRADE_CLOSED",
      tradeId: trade.id,
      pnl,
      closedAt: Date.now(),
    }),
  );
};

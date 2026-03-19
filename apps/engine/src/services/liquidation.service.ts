import { priceStore } from "../stores/price.store";
import { tradeStore } from "../stores/trade.store";
import { userStore } from "../stores/user.store";
import { redis } from "../redis/redis";

export const checkLiquidation = async () => {
  const trades = tradeStore.getAll();

  for (const trade of trades) {
    const price = priceStore.getPrice(trade.assetId);
    if (!price) continue;

    const user = userStore.get(trade.userId);
    if (!user) continue;

    let pnl = 0;

    if (trade.side === "LONG") {
      pnl = (price - trade.entryPrice) * trade.quantity * trade.leverage;
    } else {
      pnl = (trade.entryPrice - price) * trade.quantity * trade.leverage;
    }

    const margin =
      (trade.quantity * trade.entryPrice) / trade.leverage;

    if (pnl <= -margin) {
      console.log(`Trade ${trade.id} LIQUIDATED`);

      tradeStore.remove(trade.id);

      await redis.publish(
        "trade_events",
        JSON.stringify({
          type: "TRADE_LIQUIDATED",
          tradeId: trade.id,
          userId: trade.userId,
          pnl,
          price,
          liquidatedAt: Date.now(),
        })
      );
    }
  }
};
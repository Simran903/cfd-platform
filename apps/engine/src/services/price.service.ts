import { redis } from "../redis/redis";
import { priceStore } from "../stores/price.store";
import { tradeStore } from "../stores/trade.store";
import { checkLiquidation } from "./liquidation.service";
import { computeTradePnl } from "./pnl.service";

export const startPriceSubscriber = async () => {
  const subscriber = redis.duplicate();

  await subscriber.subscribe("prices");

  subscriber.on("message", async (channel, message) => {
    if (channel !== "prices") return;

    let data: unknown;
    try {
      data = JSON.parse(message);
    } catch {
      console.error("Invalid price payload");
      return;
    }

    if (
      typeof data !== "object" ||
      data === null ||
      typeof (data as { symbol?: unknown }).symbol !== "string" ||
      typeof (data as { price?: unknown }).price !== "number"
    ) {
      console.error("Price payload shape invalid");
      return;
    }

    const { symbol, price } = data as { symbol: string; price: number };

    // Update price store
    priceStore.setPrice(symbol, price);

    // PnL for trades
    for (const trade of tradeStore.getAll()) {
      if (trade.assetSymbol !== symbol) continue;

      const pnl = computeTradePnl(
        trade.side,
        trade.entryPrice,
        price,
        trade.quantity,
        trade.leverage,
      );

      await redis.publish(
        "pnl_updates",
        JSON.stringify({
          tradeId: trade.id,
          userId: trade.userId,
          pnl,
        })
      );
    }

    // Liquidation check
    await checkLiquidation();
  });
};
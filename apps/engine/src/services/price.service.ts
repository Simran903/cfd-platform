import { redis } from "../redis/redis";
import { priceStore } from "../stores/price.store";
import { tradeStore } from "../stores/trade.store";
import { checkLiquidation } from "./liquidation.service";
import { computeTradePnl } from "./pnl.service";

export const startPriceSubscriber = async () => {
  const subscriber = redis.duplicate();

  await subscriber.subscribe("prices");

  console.log("Subscribed to price updates");

  subscriber.on("message", async (channel, message) => {
    if (channel !== "prices") return;

    const data = JSON.parse(message);
    const { symbol, price } = data;

    // Update price store
    priceStore.setPrice(symbol, price);

    console.log(`Price update ${symbol}: ${price}`);

    // PnL for trades
    for (const trade of tradeStore.getAll()) {
      if (trade.assetId !== symbol) continue;

      const pnl = computeTradePnl(
        trade.side,
        trade.entryPrice,
        price,
        trade.quantity,
        trade.leverage,
      );

      console.log(`Trade ${trade.id} PnL: ${pnl}`);
    }

    // Liquidation check
    await checkLiquidation();
  });
};
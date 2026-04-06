import { redis } from "../redis/redis";
import { priceStore } from "../stores/price.store";
import { computeTradePnl } from "../services/pnl.service";
import { checkLiquidation } from "../services/liquidation.service";
import { tradeStore } from "../stores/trade.store";

interface PriceMessage {
  symbol: string;
  price: number;
}

export const startPriceConsumer = async () => {
  const sub = redis.duplicate();

  await sub.subscribe("prices");

  sub.on("message", async (_channel: string, message: string) => {
    let data: unknown;
    try {
      data = JSON.parse(message);
    } catch {
      console.error("Invalid JSON in prices channel");
      return;
    }

    const isValidPriceMessage =
      typeof data === "object" &&
      data !== null &&
      typeof (data as { symbol?: unknown }).symbol === "string" &&
      typeof (data as { price?: unknown }).price === "number";

    if (!isValidPriceMessage) {
      console.error("Invalid price message shape");
      return;
    }

    const priceMessage = data as PriceMessage;
    priceStore.setPrice(priceMessage.symbol, priceMessage.price);

    for (const trade of tradeStore.getAll()) {
      if (trade.assetSymbol !== priceMessage.symbol) continue;

      const pnl = computeTradePnl(
        trade.side,
        trade.entryPrice,
        priceMessage.price,
        trade.quantity,
        trade.leverage,
      );

      await redis.publish(
        "pnl_updates",
        JSON.stringify({
          tradeId: trade.id,
          userId: trade.userId,
          pnl,
        }),
      );
    }

    try {
      await checkLiquidation();
    } catch (error) {
      console.error("Liquidation check failed:", error);
    }
  });
};
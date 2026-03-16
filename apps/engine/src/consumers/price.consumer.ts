import { redis } from "../redis/redis";
import { priceStore } from "../stores/price.store";
import { calculatePnl } from "../services/pnl.service";
import { checkLiquidation } from "../services/liquidation.service";

interface PriceMessage {
  symbol: string;
  price: number;
}

export const startPriceConsumer = async () => {
  const sub = redis.duplicate();

  await sub.subscribe("prices");

  console.log("Subscribed to price updates");

  sub.on("message", (_channel: string, message: string) => {
    const data = JSON.parse(message) as PriceMessage;

    priceStore.setPrice(data.symbol, data.price);

    console.log(`Price update ${data.symbol}: ${data.price}`);

    calculatePnl();
    checkLiquidation();
  });
};
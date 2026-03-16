import { redis } from "./redis";
import { priceStore } from "../stores/price.store";

interface PriceMessage {
  symbol: string;
  price: number;
}

export const startPriceSubscriber = async () => {
  const sub = redis.duplicate();

  await sub.subscribe("prices");

  sub.on("message", (_channel, message) => {
    try {
      const data = JSON.parse(message) as PriceMessage;
      priceStore.setPrice(data.symbol, data.price);
      console.log("Updated price from Redis:", data.symbol, data.price);
    } catch (err) {
      console.error("Failed to process price message", err);
    }
  });
};


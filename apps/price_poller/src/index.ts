import { redis } from "./redis";

interface BinanceTickerPrice {
  price: string;
}

const fetchBTCPrice = async () => {
  const res = await fetch(
    "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
  );
  if (!res.ok) {
    throw new Error(`Binance returned ${res.status}`);
  }

  const data = (await res.json()) as Partial<BinanceTickerPrice>;
  if (typeof data.price !== "string") {
    throw new Error("Invalid Binance price payload");
  }

  const parsedPrice = Number(data.price);
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    throw new Error("Invalid parsed BTC price");
  }

  return parsedPrice;
};

export const startPricePoller = async () => {
  setInterval(async () => {
    try {
      const price = await fetchBTCPrice();

      await redis.publish(
        "prices",
        JSON.stringify({ symbol: "BTCUSDT", price }),
      );
    } catch (err) {
      console.error("Price fetch failed", err);
    }
  }, 2000);
};

startPricePoller();

import { redis } from "./redis";

interface BinanceTickerPrice {
  price: string;
}

const fetchBTCPrice = async () => {
  const res = await fetch(
    "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
  );

  const data = (await res.json()) as BinanceTickerPrice;

  return Number(data.price);
};

export const startPricePoller = async () => {
  console.log("Price poller Started");

  setInterval(async () => {
    try {
      const price = await fetchBTCPrice();
      // console.log("BTCUSDT price:", price);

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

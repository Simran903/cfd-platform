import { executeTrade } from "../engine/trade.engine";
import { redis } from "../redis/redis";

export const startTradeConsumer = async () => {
  // console.log("Listening for trades...");

  while (true) {
    const data = await redis.blpop("TRADE_QUEUE", 0);

    // console.log("Raw redis data:", data);

    if (!data) continue;

    const trade = JSON.parse(data[1]);

    // console.log("Received trade:", trade);

    await executeTrade(trade);
  }
};

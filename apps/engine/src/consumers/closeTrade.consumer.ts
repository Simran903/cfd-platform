import { closeTrade } from "../engine/close.engine";
import { redis } from "../redis/redis";

export const startCloseTradeConsumer = async () => {
  while (true) {
    const data = await redis.blpop("CLOSE_TRADE_QUEUE", 0);

    if (!data) continue;

    const payload = JSON.parse(data[1]);

    await closeTrade(payload);
  }
};

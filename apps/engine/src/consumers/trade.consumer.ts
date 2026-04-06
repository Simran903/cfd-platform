import { executeTrade } from "../engine/trade.engine";
import { redis } from "../redis/redis";

const TRADE_QUEUE = "TRADE_QUEUE";
const TRADE_PROCESSING_QUEUE = "TRADE_QUEUE_PROCESSING";

const recoverInFlightTrades = async () => {
  while (true) {
    const restored = await redis.rpoplpush(
      TRADE_PROCESSING_QUEUE,
      TRADE_QUEUE,
    );
    if (!restored) break;
  }
};

export const startTradeConsumer = async () => {
  await recoverInFlightTrades();

  while (true) {
    const rawTrade = await redis.brpoplpush(
      TRADE_QUEUE,
      TRADE_PROCESSING_QUEUE,
      0,
    );
    if (!rawTrade) continue;

    try {
      const trade = JSON.parse(rawTrade);
      await executeTrade(trade);
      await redis.lrem(TRADE_PROCESSING_QUEUE, 1, rawTrade);
    } catch (error) {
      console.error("Trade consumer failed to process payload:", error);
    }
  }
};

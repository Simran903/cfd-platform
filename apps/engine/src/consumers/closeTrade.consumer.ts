import { closeTrade } from "../engine/close.engine";
import { redis } from "../redis/redis";

const CLOSE_QUEUE = "CLOSE_TRADE_QUEUE";
const CLOSE_PROCESSING_QUEUE = "CLOSE_TRADE_QUEUE_PROCESSING";

const recoverInFlightClosures = async () => {
  while (true) {
    const restored = await redis.rpoplpush(
      CLOSE_PROCESSING_QUEUE,
      CLOSE_QUEUE,
    );
    if (!restored) break;
  }
};

export const startCloseTradeConsumer = async () => {
  await recoverInFlightClosures();

  while (true) {
    const rawPayload = await redis.brpoplpush(
      CLOSE_QUEUE,
      CLOSE_PROCESSING_QUEUE,
      0,
    );
    if (!rawPayload) continue;

    try {
      const payload = JSON.parse(rawPayload);
      await closeTrade(payload);
      await redis.lrem(CLOSE_PROCESSING_QUEUE, 1, rawPayload);
    } catch (error) {
      console.error("Close consumer failed to process payload:", error);
    }
  }
};

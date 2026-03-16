import { prisma } from "@repo/database";
import { redis } from "bun";

const startWorker = async () => {
  const sub = await redis.duplicate();

  console.log("DB worker listening for trade events");

  await sub.subscribe("trade_events", async (message: string) => {
    const event = JSON.parse(message);

    if (event.type === "TRADE_OPENED") {
      await prisma.trade.create({
        data: event.trade,
      });

      console.log("Trade persisted:", event.trade.id);
    }
  });
};

startWorker();

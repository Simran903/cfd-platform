import { prisma } from "@repo/database";
import { redis } from "bun";

const startWorker = async () => {
  const sub = await redis.duplicate();

  console.log("DB worker listening for trade events");

  await sub.subscribe("trade_events", async (message: string) => {
    const event = JSON.parse(message);

    if (event.type === "TRADE_OPENED") {
      const { createdAt, ...trade } = event.trade;
      await prisma.trade.create({
        data: {
          ...trade,
          createdAt: createdAt != null ? new Date(createdAt) : undefined,
        },
      });

      console.log("Trade persisted:", event.trade.id);
    }
  });
};

startWorker();

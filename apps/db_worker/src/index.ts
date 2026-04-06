import { prisma } from "@repo/database";
import { redis } from "bun";

type OpenTradeEvent = {
  type: "TRADE_OPENED";
  userId: string;
  trade: {
    id: string;
    userId: string;
    assetSymbol: string;
    side: "LONG" | "SHORT";
    leverage: number;
    quantity: number;
    entryPrice: number;
    createdAt?: number;
  };
};

type ClosedTradeEvent = {
  type: "TRADE_CLOSED" | "TRADE_LIQUIDATED";
  tradeId: string;
  userId: string;
  pnl?: number;
  exitPrice?: number;
  closedAt?: number;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isOpenTradeEvent = (event: unknown): event is OpenTradeEvent => {
  if (!isObject(event) || event.type !== "TRADE_OPENED") return false;
  if (typeof event.userId !== "string" || !isObject(event.trade)) return false;
  const trade = event.trade as Record<string, unknown>;
  return (
    typeof trade.id === "string" &&
    typeof trade.userId === "string" &&
    typeof trade.assetSymbol === "string" &&
    (trade.side === "LONG" || trade.side === "SHORT") &&
    typeof trade.leverage === "number" &&
    Number.isInteger(trade.leverage) &&
    typeof trade.quantity === "number" &&
    typeof trade.entryPrice === "number"
  );
};

const isClosedTradeEvent = (event: unknown): event is ClosedTradeEvent => {
  if (!isObject(event)) return false;
  const eventType = event.type;
  return (
    (eventType === "TRADE_CLOSED" || eventType === "TRADE_LIQUIDATED") &&
    typeof event.tradeId === "string" &&
    typeof event.userId === "string"
  );
};

const ensureAssetBySymbol = async (symbol: string) => {
  return prisma.asset.upsert({
    where: { symbol },
    update: {},
    create: { symbol, name: symbol },
  });
};

const processEvent = async (event: unknown) => {
  if (isOpenTradeEvent(event)) {
    const asset = await ensureAssetBySymbol(event.trade.assetSymbol);
    const createdAt =
      typeof event.trade.createdAt === "number"
        ? new Date(event.trade.createdAt)
        : new Date();

    await prisma.trade.upsert({
      where: {
        id: event.trade.id,
      },
      update: {
        assetId: asset.id,
        side: event.trade.side,
        leverage: event.trade.leverage,
        quantity: event.trade.quantity,
        entryPrice: event.trade.entryPrice,
        status: "OPEN",
      },
      create: {
        id: event.trade.id,
        userId: event.trade.userId,
        assetId: asset.id,
        side: event.trade.side,
        leverage: event.trade.leverage,
        quantity: event.trade.quantity,
        entryPrice: event.trade.entryPrice,
        status: "OPEN",
        createdAt,
      },
    });

    return;
  }

  if (isClosedTradeEvent(event)) {
    await prisma.trade.updateMany({
      where: { id: event.tradeId, userId: event.userId },
      data: {
        status: event.type === "TRADE_LIQUIDATED" ? "LIQUIDATED" : "CLOSED",
      },
    });

    return;
  }

  console.error("Unknown event shape, skipping");
};

const startWorker = async () => {
  while (true) {
    const data = await redis.blpop("DB_TRADE_EVENTS_QUEUE", 0);
    if (!data) continue;

    const rawMessage = data[1];
    try {
      const event = JSON.parse(rawMessage);
      await processEvent(event);
    } catch (error) {
      console.error("Failed to process DB queue event:", error);
    }
  }
};

startWorker();

-- CreateEnum
CREATE TYPE "TradeCloseReason" AS ENUM ('USER', 'STOP_LOSS', 'TAKE_PROFIT', 'LIQUIDATED');

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "decimals" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "closeReason" "TradeCloseReason",
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "exitPrice" DOUBLE PRECISION,
ADD COLUMN     "realizedPnl" DOUBLE PRECISION,
ADD COLUMN     "stopLoss" DOUBLE PRECISION,
ADD COLUMN     "takeProfit" DOUBLE PRECISION;

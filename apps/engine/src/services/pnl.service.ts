export const computeTradePnl = (
  side: "LONG" | "SHORT",
  entryPrice: number,
  currentPrice: number,
  quantity: number,
  leverage: number,
) => {
  if (side === "LONG") {
    return (currentPrice - entryPrice) * quantity * leverage;
  }
  return (entryPrice - currentPrice) * quantity * leverage;
};

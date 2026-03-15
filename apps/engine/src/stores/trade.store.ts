export type Trade = {
  id: string;
  userId: string;
  assetId: string;
  side: "LONG" | "SHORT";
  leverage: number;
  quantity: number;
  entryPrice: number;
};

class TradeStore {
  private trades = new Map<string, Trade>();

  add(trade: Trade) {
    this.trades.set(trade.id, trade);
  }

  getAll() {
    return [...this.trades.values()];
  }
}

export const tradeStore = new TradeStore();

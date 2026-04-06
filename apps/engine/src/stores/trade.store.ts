export type Trade = {
  id: string;
  userId: string;
  assetSymbol: string;
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

  get(tradeId: string) {
    return this.trades.get(tradeId);
  }

  getAll() {
    return [...this.trades.values()];
  }

  remove(tradeId: string) {
    this.trades.delete(tradeId);
  }
}

export const tradeStore = new TradeStore();

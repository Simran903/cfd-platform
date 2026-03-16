import { priceStore } from "../stores/price.store";
import { tradeStore } from "../stores/trade.store";

export const calculatePnl = () => {
  const trades = tradeStore.getAll();

  for (const trade of trades) {
    const currentPrice = priceStore.getPrice(trade.assetId);

    if (!currentPrice) continue;

    let pnl = 0;

    if (trade.side === "LONG") {
      pnl = (currentPrice - trade.entryPrice) * trade.quantity * trade.leverage;
    } else {
      pnl = (trade.entryPrice - currentPrice) * trade.quantity * trade.leverage;
    }

    console.log(`Trade ${trade.id} PnL: ${pnl}`);
  }
};

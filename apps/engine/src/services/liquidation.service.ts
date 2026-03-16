import { priceStore } from "../stores/price.store";
import { tradeStore } from "../stores/trade.store";
import { userStore } from "../stores/user.store";

export const checkLiquidation = () => {
  const trades = tradeStore.getAll();

  for (const trade of trades) {
    const price = priceStore.getPrice(trade.assetId);
    if (!price) continue;

    const user = userStore.get(trade.userId);
    if (!user) continue;

    let pnl = 0;

    if (trade.side === "LONG") {
      pnl = (price - trade.entryPrice) * trade.quantity * trade.leverage;
    } else {
      pnl = (trade.entryPrice - price) * trade.quantity * trade.leverage;
    }

    const equity = user.balance + pnl;

    if (equity <= 0) {
      console.log(`Trade ${trade.id} liquidated`);
      tradeStore.remove(trade.id);
    }
  }
};

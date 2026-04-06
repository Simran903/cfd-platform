import { priceStore } from "../stores/price.store";
import { tradeStore } from "../stores/trade.store";
import { userStore } from "../stores/user.store";
import { closeTrade } from "../engine/close.engine";

export const checkLiquidation = async () => {
  const trades = tradeStore.getAll();

  for (const trade of trades) {
    const price = priceStore.getPrice(trade.assetSymbol);
    if (price == null) continue;

    const user = userStore.get(trade.userId);
    if (!user) continue;

    let pnl = 0;

    if (trade.side === "LONG") {
      pnl = (price - trade.entryPrice) * trade.quantity * trade.leverage;
    } else {
      pnl = (trade.entryPrice - price) * trade.quantity * trade.leverage;
    }

    const margin =
      (trade.quantity * trade.entryPrice) / trade.leverage;

    if (pnl <= -margin) {
      await closeTrade({
        tradeId: trade.id,
        userId: trade.userId,
        liquidated: true,
      });
    }
  }
};
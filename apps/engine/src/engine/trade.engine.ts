import { tradeStore } from "../stores/trade.store";
import { userStore } from "../stores/user.store";

export const executeTrade = (trade: any) => {
  const margin = (trade.quantity * trade.entryPrice) / trade.leverage;

  const user = userStore.get(trade.userId);

  if (!user || user.balance < margin) {
    console.log("Insufficient balance");
    return;
  }

  userStore.updateBalance(trade.userId, -margin);

  tradeStore.add(trade);

  console.log("Trade executed:", trade.id);
};

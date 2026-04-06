import { bootstrapEngine } from "./bootstrap/bootstrap";
import { startCloseTradeConsumer } from "./consumers/closeTrade.consumer";
import { startPriceConsumer } from "./consumers/price.consumer";
import { startTradeConsumer } from "./consumers/trade.consumer";

const start = async () => {
  await bootstrapEngine();

  startPriceConsumer();
  startTradeConsumer();
  startCloseTradeConsumer();
};

start();

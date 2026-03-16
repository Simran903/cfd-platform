import { bootstrapEngine } from "./bootstrap/bootstrap";
import { startPriceConsumer } from "./consumers/price.consumer";
import { startTradeConsumer } from "./consumers/trade.consumer";

const start = async () => {
  console.log("Trading Engine Started");

  await bootstrapEngine();

  console.log("Engine ready. Listening for trades...");

  startPriceConsumer();
  startTradeConsumer();
};

start();

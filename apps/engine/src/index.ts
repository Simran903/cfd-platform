import { bootstrapEngine } from "./bootstrap/bootstrap";
import { startTradeConsumer } from "./consumers/trade.consumer";
import { startPriceSubscriber } from "./redis/price-subscriber";

const start = async () => {
  console.log("Trading Engine Started");

  await bootstrapEngine();

  console.log("Engine ready. Listening for trades...");

  await startPriceSubscriber();

  startTradeConsumer();
};

start();
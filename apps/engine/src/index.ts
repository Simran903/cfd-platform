import { bootstrapEngine } from "./bootstrap/bootstrap";
import { startTradeConsumer } from "./consumers/trade.consumer";

const start = async () => {

  console.log("Trading Engine Started");

  await bootstrapEngine();

  console.log("Engine ready. Listening for trades...");

  startTradeConsumer();

}

start();
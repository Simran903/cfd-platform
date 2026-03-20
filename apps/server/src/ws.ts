import { WebSocketServer } from "ws";
import Redis from "ioredis";

const redis = new Redis();
const subscriber = new Redis();

export const startWebSocketServer = async (server: any) => {
  const wss = new WebSocketServer({ server });

  console.log("WebSocket server started");

  wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });

  // subscribe to events from engine
  subscriber.subscribe("trade_events");
  subscriber.subscribe("prices");
  subscriber.subscribe("pnl_updates");
  

  subscriber.on("message", (channel, message) => {
    const data = JSON.parse(message);

    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(
          JSON.stringify({
            channel,
            data,
          }),
        );
      } 
    });
  });
};

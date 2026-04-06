import { WebSocket, WebSocketServer } from "ws";
import Redis from "ioredis";
import { verifyToken } from "./utils/jwt";

const redis = new Redis();
const subscriber = new Redis();

type SocketWithUser = WebSocket & { userId?: string };

const parseTokenFromUrl = (url: string | undefined) => {
  if (!url) return null;
  try {
    const parsed = new URL(url, "http://localhost");
    return parsed.searchParams.get("token");
  } catch {
    return null;
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const startWebSocketServer = async (server: any) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    const socket = ws as SocketWithUser;
    const token = parseTokenFromUrl(req.url);
    if (token) {
      try {
        socket.userId = verifyToken(token).userId;
      } catch {
        ws.close(1008, "Invalid token");
        return;
      }
    }
  });

  // Register listener before subscribe so ioredis does not drop early pub/sub messages.
  subscriber.on("message", (channel, message) => {
    let data: unknown;
    try {
      data = JSON.parse(message);
    } catch {
      console.error(`Invalid JSON on channel ${channel}`);
      return;
    }

    wss.clients.forEach((client) => {
      const socket = client as SocketWithUser;
      if (socket.readyState !== 1) return;

      if (channel !== "prices") {
        if (!isObject(data) || typeof data.userId !== "string") {
          return;
        }
        if (!socket.userId || socket.userId !== data.userId) {
          return;
        }
      }

      if (socket.readyState === 1) {
        client.send(
          JSON.stringify({
            channel,
            data,
          }),
        );
      }
    });
  });

  await subscriber.subscribe("trade_events", "prices", "pnl_updates");
};

import app from "./app";
import http from "http";
import { startWebSocketServer } from "./ws";

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

startWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

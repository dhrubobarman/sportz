import { WebSocket, WebSocketServer } from "ws";
import { Match } from "../db/schema";
import { Server } from "../types";

interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}

function sendJson<D>(socket: WebSocket, payload: D) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function brodcast<D>(wss: WebSocketServer, payload: D) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    sendJson(client, payload);
  }
}

export function attachWebsockerServer(server: Server) {
  const wss = new WebSocketServer({
    server: server as any,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });
  wss.on("connection", (socket: ExtWebSocket) => {
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });
    sendJson(socket, { type: "welcome" });
    socket.on("error", console.log);
  });

  const interval = setInterval(() => {
    wss.clients.forEach((socket) => {
      const extSocket = socket as ExtWebSocket;
      if (!extSocket.isAlive) {
        return socket.terminate();
      }
      extSocket.isAlive = false;
      extSocket.ping();
    });
  }, 30000);

  server.on("close", () => {
    clearInterval(interval);
    wss.close();
  });

  function brodcastMatchCreated(match: Match) {
    brodcast(wss, { type: "match_created", data: match });
  }

  return {
    brodcastMatchCreated,
  };
}

export type WebsocketServer = ReturnType<typeof attachWebsockerServer>;

import { WebSocket, WebSocketServer } from "ws";
import { Match } from "../db/schema";
import { Server } from "../types";

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
  wss.on("connection", (socket) => {
    sendJson(socket, { type: "welcome" });
    socket.on("error", console.log);
  });

  function brodcastMatchCreated(match: Match) {
    brodcast(wss, { type: "match_created", data: match });
  }

  return {
    brodcastMatchCreated,
  };
}

export type WebsocketServer = ReturnType<typeof attachWebsockerServer>;

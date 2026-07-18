import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const PORT = parseInt(process.env.VOICE_PORT || "3002");

export function startVoiceServer(): void {
  const httpServer = createServer();
  const wss = new WebSocketServer({ server: httpServer, path: "/signaling" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("[signaling] Peer connected");

    ws.on("message", (data: Buffer) => {
      const msg = JSON.parse(data.toString());
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(msg));
        }
      });
    });

    ws.on("close", () => console.log("[signaling] Peer disconnected"));
  });

  httpServer.listen(PORT + 10, () => {
    console.log(`[signaling] Ready on ws://localhost:${PORT + 10}/signaling`);
  });
}

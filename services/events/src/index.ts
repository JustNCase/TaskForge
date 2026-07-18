import { createServer, IncomingMessage, ServerResponse } from "http";
import { WebSocketServer, WebSocket } from "ws";

const PORT = parseInt(process.env.EVENTS_PORT || "3007");

interface StoredEvent {
  id: string;
  type: string;
  source: string;
  data: Record<string, unknown>;
  timestamp: string;
}

const eventLog: StoredEvent[] = [];
const eventLogMax = 1000;
const subscriptions = new Map<string, Set<WebSocket>>();
let eventCounter = 0;

function sendJSON(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function broadcastEvent(event: StoredEvent): void {
  for (const [eventType, clients] of subscriptions) {
    if (eventType === "*" || eventType === event.type) {
      const msg = JSON.stringify({ type: "event", event });
      for (const ws of clients) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(msg);
        }
      }
    }
  }
}

function publishEvent(type: string, source: string, data: Record<string, unknown>): StoredEvent {
  const event: StoredEvent = {
    id: `evt_${++eventCounter}_${Date.now()}`,
    type,
    source,
    data,
    timestamp: new Date().toISOString(),
  };
  eventLog.unshift(event);
  if (eventLog.length > eventLogMax) eventLog.length = eventLogMax;
  broadcastEvent(event);
  return event;
}

async function handlePublish(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.type) return sendJSON(res, 400, { error: "Missing required field: type" });
  const event = publishEvent(body.type, body.source || "api", body.data || {});
  sendJSON(res, 201, { event });
}

async function handleListEvents(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const type = url.searchParams.get("type");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const source = url.searchParams.get("source");

  let filtered = eventLog;
  if (type) filtered = filtered.filter((e) => e.type === type);
  if (source) filtered = filtered.filter((e) => e.source === source);
  filtered = filtered.slice(0, Math.min(limit, 100));

  sendJSON(res, 200, { events: filtered, count: filtered.length, total: eventLog.length });
}

async function handleGetEvent(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const id = url.pathname.replace("/events/", "");
  const event = eventLog.find((e) => e.id === id);
  if (!event) return sendJSON(res, 404, { error: "Event not found" });
  sendJSON(res, 200, { event });
}

async function handleClearEvents(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  eventLog.length = 0;
  sendJSON(res, 200, { ok: true, message: "Event log cleared" });
}

const httpServer = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    return res.end();
  }

  if (req.url === "/health") {
    return sendJSON(res, 200, { status: "ok", service: "genesis-events", stored: eventLog.length });
  }

  try {
    if (req.url === "/publish" && req.method === "POST") return await handlePublish(req, res);
    if (req.url === "/events" && req.method === "GET") return await handleListEvents(req, res);
    if (req.url === "/events/clear" && req.method === "DELETE") return await handleClearEvents(req, res);
    if (req.url?.startsWith("/events/") && req.method === "GET") return await handleGetEvent(req, res, new URL(req.url, `http://${req.headers.host}`));
  } catch (err: any) {
    console.error(`[genesis:events] Error on ${req.url}:`, err?.message);
    return sendJSON(res, 500, { error: err?.message || "Internal error" });
  }

  sendJSON(res, 404, { error: "Not found" });
});

const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

wss.on("connection", (ws: WebSocket) => {
  const subscribedTypes = new Set<string>();

  ws.on("message", (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case "subscribe":
          if (msg.eventType) {
            subscribedTypes.add(msg.eventType);
            if (!subscriptions.has(msg.eventType)) {
              subscriptions.set(msg.eventType, new Set());
            }
            subscriptions.get(msg.eventType)!.add(ws);
            ws.send(JSON.stringify({ type: "subscribed", eventType: msg.eventType }));
          }
          break;

        case "unsubscribe":
          if (msg.eventType) {
            subscribedTypes.delete(msg.eventType);
            subscriptions.get(msg.eventType)?.delete(ws);
            ws.send(JSON.stringify({ type: "unsubscribed", eventType: msg.eventType }));
          }
          break;

        case "publish":
          if (msg.event?.type) {
            const event = publishEvent(msg.event.type, msg.source || "ws-client", msg.event.data || {});
            ws.send(JSON.stringify({ type: "published", event }));
          } else {
            ws.send(JSON.stringify({ type: "error", message: "Missing event.type" }));
          }
          break;

        case "ping":
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
          break;

        default:
          ws.send(JSON.stringify({ type: "error", message: `Unknown message type: ${msg.type}` }));
      }
    } catch (err: any) {
      ws.send(JSON.stringify({ type: "error", message: err?.message || "Invalid message" }));
    }
  });

  ws.on("close", () => {
    for (const eventType of subscribedTypes) {
      subscriptions.get(eventType)?.delete(ws);
    }
  });

  ws.send(JSON.stringify({ type: "connected", message: "Connected to genesis-events" }));
});

httpServer.listen(PORT, () => {
  console.log(`[genesis:events] Ready at http://localhost:${PORT}`);
  console.log(`[genesis:events] WebSocket at ws://localhost:${PORT}/ws`);
  console.log(`[genesis:events] Endpoints: POST /publish, GET /events, DELETE /events/clear`);
});

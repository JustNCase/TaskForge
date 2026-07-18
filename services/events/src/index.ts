import { createServer, IncomingMessage, ServerResponse } from "http";
import { WebSocketServer, WebSocket } from "ws";
import {
  createAuthMiddleware,
  createRateLimitMiddleware,
  createCorsMiddleware,
  sendJSON,
  readBody,
} from "@taskforge/middleware";
import { getServerClient, findAll, insert, remove } from "@taskforge/database";
import type { StoredEvent } from "@taskforge/database";

const PORT = parseInt(process.env.EVENTS_PORT || "3007");

const subscriptions = new Map<string, Set<WebSocket>>();
let eventCounter = 0;
let dbAvailable = false;

const eventLog: StoredEvent[] = [];
const eventLogMax = 1000;

const auth = createAuthMiddleware({ publicRoutes: ["/health"] });
const rateLimit = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 120 });
const cors = createCorsMiddleware();

async function initDatabase(): Promise<void> {
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const client = getServerClient();
      const events = await findAll<StoredEvent>(client, "stored_events", {
        order: { column: "timestamp", ascending: false },
        limit: eventLogMax,
      });
      eventLog.push(...events);
      dbAvailable = true;
      console.log(`[genesis:events] Database connected, loaded ${events.length} events`);
    } else {
      console.log("[genesis:events] No database configured, using in-memory store");
    }
  } catch (err: any) {
    console.warn(`[genesis:events] Database init failed, using in-memory: ${err?.message}`);
  }
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

async function publishEvent(type: string, source: string, data: Record<string, unknown>): Promise<StoredEvent> {
  const event: StoredEvent = {
    id: `evt_${++eventCounter}_${Date.now()}`,
    type,
    source,
    data,
    timestamp: new Date().toISOString(),
  };
  eventLog.unshift(event);
  if (eventLog.length > eventLogMax) eventLog.length = eventLogMax;

  if (dbAvailable) {
    try {
      const client = getServerClient();
      await insert(client, "stored_events", event);
    } catch (err: any) {
      console.error(`[genesis:events] Failed to persist event: ${err?.message}`);
    }
  }

  broadcastEvent(event);
  return event;
}

async function handlePublish(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.type) return sendJSON(res, 400, { error: "Missing required field: type" });
  const event = await publishEvent(body.type, body.source || "api", body.data || {});
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

  if (dbAvailable) {
    try {
      const client = getServerClient();
      const allEvents = await findAll<StoredEvent>(client, "stored_events", { limit: 1000 });
      for (const evt of allEvents) {
        await remove(client, "stored_events", evt.id);
      }
    } catch (err: any) {
      console.error(`[genesis:events] Failed to clear DB: ${err?.message}`);
    }
  }

  sendJSON(res, 200, { ok: true, message: "Event log cleared" });
}

const httpServer = createServer(async (req, res) => {
  cors(req, res, () => {
    if (req.method === "OPTIONS") return;

    if (req.url === "/health") {
      return sendJSON(res, 200, {
        status: "ok",
        service: "taskforge-events",
        stored: eventLog.length,
        database: dbAvailable,
      });
    }

    auth(req, res, () => {
      rateLimit(req, res, async () => {
        try {
          const path = req.url?.split("?")[0];
          if (path === "/publish" && req.method === "POST") return await handlePublish(req, res);
          if (path === "/events" && req.method === "GET") return await handleListEvents(req, res);
          if (path === "/events/clear" && req.method === "DELETE") return await handleClearEvents(req, res);
          if (path?.startsWith("/events/") && req.method === "GET") return await handleGetEvent(req, res, new URL(req.url, `http://${req.headers.host}`));
        } catch (err: any) {
          console.error(`[genesis:events] Error on ${req.url}:`, err?.message);
          return sendJSON(res, 500, { error: err?.message || "Internal error" });
        }

        sendJSON(res, 404, { error: "Not found" });
      });
    });
  });
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
            publishEvent(msg.event.type, msg.source || "ws-client", msg.event.data || {}).then((event) => {
              ws.send(JSON.stringify({ type: "published", event }));
            });
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

  ws.send(JSON.stringify({ type: "connected", message: "Connected to taskforge-events" }));
});

initDatabase().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`[genesis:events] Ready at http://localhost:${PORT}`);
    console.log(`[genesis:events] WebSocket at ws://localhost:${PORT}/ws`);
    console.log(`[genesis:events] Endpoints: POST /publish, GET /events, DELETE /events/clear`);
  });
});

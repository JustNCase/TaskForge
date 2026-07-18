import { createServer, IncomingMessage, ServerResponse } from "http";
import { WebSocketServer, WebSocket } from "ws";

const PORT = parseInt(process.env.NOTIFICATIONS_PORT || "3008");

interface Notification {
  id: string;
  userId: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  source?: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationPreference {
  userId: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
  digest: "instant" | "hourly" | "daily" | "never";
  types: Record<string, boolean>;
}

const notifications: Notification[] = [];
const notificationMax = 500;
const preferences = new Map<string, NotificationPreference>();
const userConnections = new Map<string, Set<WebSocket>>();
let notifCounter = 0;

function sendJSON(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

function sendToUser(userId: string, data: unknown): void {
  const msg = JSON.stringify(data);
  const connections = userConnections.get(userId);
  if (connections) {
    for (const ws of connections) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }
}

function createNotification(userId: string, type: Notification["type"], title: string, message: string, source?: string, actionUrl?: string): Notification {
  const notif: Notification = {
    id: `notif_${++notifCounter}_${Date.now()}`,
    userId, type, title, message, source, actionUrl,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(notif);
  if (notifications.length > notificationMax) notifications.length = notificationMax;

  const pref = preferences.get(userId);
  if (!pref || pref.inApp) {
    sendToUser(userId, { type: "notification", notification: notif });
  }

  return notif;
}

async function handleSend(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.userId || !body.title || !body.message) {
    return sendJSON(res, 400, { error: "Missing required fields: userId, title, message" });
  }
  const notif = createNotification(
    body.userId, body.type || "info", body.title, body.message,
    body.source, body.actionUrl
  );
  sendJSON(res, 201, { notification: notif });
}

async function handleListNotifications(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const userId = url.searchParams.get("userId");
  const unreadOnly = url.searchParams.get("unread") === "true";
  const limit = parseInt(url.searchParams.get("limit") || "50");

  if (!userId) return sendJSON(res, 400, { error: "Missing required param: userId" });

  let filtered = notifications.filter((n) => n.userId === userId);
  if (unreadOnly) filtered = filtered.filter((n) => !n.read);
  filtered = filtered.slice(0, Math.min(limit, 100));

  const unreadCount = notifications.filter((n) => n.userId === userId && !n.read).length;
  sendJSON(res, 200, { notifications: filtered, count: filtered.length, unread: unreadCount });
}

async function handleMarkRead(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const id = url.pathname.replace("/notifications/", "").replace("/read", "");
  const notif = notifications.find((n) => n.id === id);
  if (!notif) return sendJSON(res, 404, { error: "Notification not found" });
  notif.read = true;
  sendJSON(res, 200, { notification: notif });
}

async function handleMarkAllRead(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.userId) return sendJSON(res, 400, { error: "Missing required field: userId" });
  let count = 0;
  for (const n of notifications) {
    if (n.userId === body.userId && !n.read) { n.read = true; count++; }
  }
  sendToUser(body.userId, { type: "all_read", userId: body.userId });
  sendJSON(res, 200, { ok: true, markedRead: count });
}

async function handlePreferences(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const userId = url.searchParams.get("userId");
  if (!userId) return sendJSON(res, 400, { error: "Missing required param: userId" });

  if (req.method === "GET") {
    const pref = preferences.get(userId) || {
      userId, email: false, push: false, inApp: true,
      digest: "instant", types: {},
    };
    return sendJSON(res, 200, { preferences: pref });
  }

  if (req.method === "PUT") {
    const body = JSON.parse(await readBody(req));
    const existing = preferences.get(userId) || {
      userId, email: false, push: false, inApp: true, digest: "instant" as const, types: {},
    };
    preferences.set(userId, {
      userId,
      email: body.email ?? existing.email,
      push: body.push ?? existing.push,
      inApp: body.inApp ?? existing.inApp,
      digest: body.digest ?? existing.digest,
      types: body.types ?? existing.types,
    });
    return sendJSON(res, 200, { preferences: preferences.get(userId) });
  }

  sendJSON(res, 405, { error: "Method not allowed" });
}

async function handleBroadcast(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.title || !body.message) {
    return sendJSON(res, 400, { error: "Missing required fields: title, message" });
  }
  const targetUserIds = body.userIds as string[] | undefined;
  const notificationIds: string[] = [];

  if (targetUserIds && targetUserIds.length > 0) {
    for (const userId of targetUserIds) {
      const n = createNotification(userId, body.type || "info", body.title, body.message, "broadcast");
      notificationIds.push(n.id);
    }
  } else {
    for (const userId of userConnections.keys()) {
      const n = createNotification(userId, body.type || "info", body.title, body.message, "broadcast");
      notificationIds.push(n.id);
    }
  }

  sendJSON(res, 201, { notificationIds, count: notificationIds.length });
}

const httpServer = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    return res.end();
  }

  if (req.url === "/health") {
    return sendJSON(res, 200, { status: "ok", service: "genesis-notifications", stored: notifications.length });
  }

  try {
    if (req.url === "/send" && req.method === "POST") return await handleSend(req, res);
    if (req.url === "/broadcast" && req.method === "POST") return await handleBroadcast(req, res);
    if (req.url === "/notifications" && req.method === "GET") return await handleListNotifications(req, res);
    if (req.url === "/notifications/read-all" && req.method === "POST") return await handleMarkAllRead(req, res);
    if (req.url?.startsWith("/notifications/") && req.url?.endsWith("/read") && req.method === "POST") return await handleMarkRead(req, res);
    if (req.url?.startsWith("/preferences")) return await handlePreferences(req, res, new URL(req.url, `http://${req.headers.host}`));
  } catch (err: any) {
    console.error(`[genesis:notifications] Error on ${req.url}:`, err?.message);
    return sendJSON(res, 500, { error: err?.message || "Internal error" });
  }

  sendJSON(res, 404, { error: "Not found" });
});

const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

wss.on("connection", (ws: WebSocket) => {
  let currentUserId: string | null = null;

  ws.on("message", (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case "auth":
          if (msg.userId) {
            currentUserId = msg.userId;
            if (!userConnections.has(msg.userId)) {
              userConnections.set(msg.userId, new Set());
            }
            userConnections.get(msg.userId)!.add(ws);
            ws.send(JSON.stringify({ type: "authed", userId: msg.userId }));
          } else {
            ws.send(JSON.stringify({ type: "error", message: "Missing userId" }));
          }
          break;

        case "subscribe":
          ws.send(JSON.stringify({ type: "subscribed", message: "Connected to notification stream" }));
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
    if (currentUserId) {
      userConnections.get(currentUserId)?.delete(ws);
      if (userConnections.get(currentUserId)?.size === 0) {
        userConnections.delete(currentUserId);
      }
    }
  });

  ws.send(JSON.stringify({ type: "connected", message: "Connected to genesis-notifications" }));
});

httpServer.listen(PORT, () => {
  console.log(`[genesis:notifications] Ready at http://localhost:${PORT}`);
  console.log(`[genesis:notifications] WebSocket at ws://localhost:${PORT}/ws`);
  console.log(`[genesis:notifications] Endpoints: POST /send, POST /broadcast, GET /notifications, POST /notifications/read-all, GET|PUT /preferences`);
});

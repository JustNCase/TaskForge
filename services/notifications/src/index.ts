import { createServer, IncomingMessage, ServerResponse } from "http";
import { WebSocketServer, WebSocket } from "ws";
import {
  createAuthMiddleware,
  createRateLimitMiddleware,
  createCorsMiddleware,
  sendJSON,
  readBody,
} from "@taskforge/middleware";
import { getServerClient, findAll, insert, update, count } from "@taskforge/database";
import type { Notification, NotificationPreference } from "@taskforge/database";

const PORT = parseInt(process.env.NOTIFICATIONS_PORT || "3008");

const inMemoryNotifications: Notification[] = [];
const notificationMax = 500;
const preferences = new Map<string, NotificationPreference>();
const userConnections = new Map<string, Set<WebSocket>>();
let notifCounter = 0;
let dbAvailable = false;

const auth = createAuthMiddleware({ publicRoutes: ["/health"] });
const rateLimit = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 80 });
const cors = createCorsMiddleware();

function mapFromDb(n: Notification): Notification {
  return n;
}

async function initDatabase(): Promise<void> {
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const client = getServerClient();
      const notifications = await findAll<Notification>(client, "notifications", {
        order: { column: "created_at", ascending: false },
        limit: notificationMax,
      });
      inMemoryNotifications.push(...notifications.map(mapFromDb));

      const prefs = await findAll<NotificationPreference>(client, "notification_preferences");
      for (const pref of prefs) {
        preferences.set(pref.user_id, pref);
      }

      dbAvailable = true;
      console.log(`[genesis:notifications] Database connected, loaded ${notifications.length} notifications`);
    } else {
      console.log("[genesis:notifications] No database configured, using in-memory store");
    }
  } catch (err: any) {
    console.warn(`[genesis:notifications] Database init failed, using in-memory: ${err?.message}`);
  }
}

const notifTypeMap: Record<string, Notification["type"]> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
};

function sendToUser(userId: string, data: unknown): void {
  const msg = JSON.stringify(data);
  const connections = userConnections.get(userId);
  if (connections) {
    for (const ws of connections) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }
}

async function persistNotification(notif: Notification): Promise<void> {
  if (!dbAvailable) return;
  try {
    const client = getServerClient();
    await insert(client, "notifications", {
      id: notif.id,
      user_id: notif.user_id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      source: notif.source,
      action_url: notif.action_url,
      read: notif.read,
      created_at: notif.created_at,
    });
  } catch (err: any) {
    console.error(`[genesis:notifications] Failed to persist notification: ${err?.message}`);
  }
}

async function updateNotificationRead(id: string): Promise<void> {
  if (!dbAvailable) return;
  try {
    const client = getServerClient();
    await update(client, "notifications", id, { read: true });
  } catch (err: any) {
    console.error(`[genesis:notifications] Failed to update notification: ${err?.message}`);
  }
}

async function createNotification(
  userId: string,
  type: Notification["type"],
  title: string,
  message: string,
  source?: string,
  actionUrl?: string
): Promise<Notification> {
  const notif: Notification = {
    id: `notif_${++notifCounter}_${Date.now()}`,
    user_id: userId,
    type,
    title,
    message,
    source: source || null,
    action_url: actionUrl || null,
    read: false,
    created_at: new Date().toISOString(),
  };

  inMemoryNotifications.unshift(notif);
  if (inMemoryNotifications.length > notificationMax) inMemoryNotifications.length = notificationMax;

  await persistNotification(notif);

  const pref = preferences.get(userId);
  if (!pref || pref.in_app) {
    sendToUser(userId, { type: "notification", notification: notif });
  }

  return notif;
}

async function handleSend(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.userId || !body.title || !body.message) {
    return sendJSON(res, 400, { error: "Missing required fields: userId, title, message" });
  }
  const notif = await createNotification(
    body.userId,
    notifTypeMap[body.type] || "info",
    body.title,
    body.message,
    body.source,
    body.actionUrl
  );
  sendJSON(res, 201, { notification: notif });
}

async function handleListNotifications(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const userId = url.searchParams.get("userId");
  const unreadOnly = url.searchParams.get("unread") === "true";
  const limit = parseInt(url.searchParams.get("limit") || "50");

  if (!userId) return sendJSON(res, 400, { error: "Missing required param: userId" });

  let filtered = inMemoryNotifications.filter((n) => n.user_id === userId);
  if (unreadOnly) filtered = filtered.filter((n) => !n.read);
  filtered = filtered.slice(0, Math.min(limit, 100));

  const unreadCount = inMemoryNotifications.filter((n) => n.user_id === userId && !n.read).length;
  sendJSON(res, 200, { notifications: filtered, count: filtered.length, unread: unreadCount });
}

async function handleMarkRead(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const id = url.pathname.replace("/notifications/", "").replace("/read", "");
  const notif = inMemoryNotifications.find((n) => n.id === id);
  if (!notif) return sendJSON(res, 404, { error: "Notification not found" });
  notif.read = true;
  await updateNotificationRead(id);
  sendJSON(res, 200, { notification: notif });
}

async function handleMarkAllRead(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.userId) return sendJSON(res, 400, { error: "Missing required field: userId" });
  let count = 0;
  for (const n of inMemoryNotifications) {
    if (n.user_id === body.userId && !n.read) {
      n.read = true;
      count++;
      if (dbAvailable) await updateNotificationRead(n.id);
    }
  }
  sendToUser(body.userId, { type: "all_read", userId: body.userId });
  sendJSON(res, 200, { ok: true, markedRead: count });
}

async function handlePreferences(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const userId = url.searchParams.get("userId");
  if (!userId) return sendJSON(res, 400, { error: "Missing required param: userId" });

  if (req.method === "GET") {
    const pref = preferences.get(userId) || {
      user_id: userId,
      email: false,
      push: false,
      in_app: true,
      digest: "instant" as const,
      types: {},
    };
    return sendJSON(res, 200, { preferences: pref });
  }

  if (req.method === "PUT") {
    const body = JSON.parse(await readBody(req));
    const existing = preferences.get(userId) || {
      user_id: userId,
      email: false,
      push: false,
      in_app: true,
      digest: "instant" as const,
      types: {},
    };
    const updated: NotificationPreference = {
      user_id: userId,
      email: body.email ?? existing.email,
      push: body.push ?? existing.push,
      in_app: body.inApp ?? existing.in_app,
      digest: body.digest ?? existing.digest,
      types: body.types ?? existing.types,
    };
    preferences.set(userId, updated);

    if (dbAvailable) {
      try {
        const client = getServerClient();
        await insert(client, "notification_preferences", {
          user_id: userId,
          email: updated.email,
          push: updated.push,
          in_app: updated.in_app,
          digest: updated.digest,
          types: updated.types,
        });
      } catch (err: any) {
        console.error(`[genesis:notifications] Failed to persist preferences: ${err?.message}`);
      }
    }

    return sendJSON(res, 200, { preferences: updated });
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
      const n = await createNotification(userId, notifTypeMap[body.type] || "info", body.title, body.message, "broadcast");
      notificationIds.push(n.id);
    }
  } else {
    for (const userId of userConnections.keys()) {
      const n = await createNotification(userId, notifTypeMap[body.type] || "info", body.title, body.message, "broadcast");
      notificationIds.push(n.id);
    }
  }

  sendJSON(res, 201, { notificationIds, count: notificationIds.length });
}

const httpServer = createServer(async (req, res) => {
  cors(req, res, () => {
    if (req.method === "OPTIONS") return;

    if (req.url === "/health") {
      return sendJSON(res, 200, {
        status: "ok",
        service: "taskforge-notifications",
        stored: inMemoryNotifications.length,
        database: dbAvailable,
      });
    }

    auth(req, res, () => {
      rateLimit(req, res, async () => {
        try {
          const path = req.url?.split("?")[0];
          if (path === "/send" && req.method === "POST") return await handleSend(req, res);
          if (path === "/broadcast" && req.method === "POST") return await handleBroadcast(req, res);
          if (path === "/notifications" && req.method === "GET") return await handleListNotifications(req, res);
          if (path === "/notifications/read-all" && req.method === "POST") return await handleMarkAllRead(req, res);
          if (path?.startsWith("/notifications/") && path?.endsWith("/read") && req.method === "POST") return await handleMarkRead(req, res);
          if (path?.startsWith("/preferences")) return await handlePreferences(req, res, new URL(req.url, `http://${req.headers.host}`));
        } catch (err: any) {
          console.error(`[genesis:notifications] Error on ${req.url}:`, err?.message);
          return sendJSON(res, 500, { error: err?.message || "Internal error" });
        }

        sendJSON(res, 404, { error: "Not found" });
      });
    });
  });
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

  ws.send(JSON.stringify({ type: "connected", message: "Connected to taskforge-notifications" }));
});

initDatabase().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`[genesis:notifications] Ready at http://localhost:${PORT}`);
    console.log(`[genesis:notifications] WebSocket at ws://localhost:${PORT}/ws`);
    console.log(`[genesis:notifications] Endpoints: POST /send, POST /broadcast, GET /notifications, POST /notifications/read-all, GET|PUT /preferences`);
  });
});

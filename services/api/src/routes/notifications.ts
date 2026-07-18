import type { IncomingMessage, ServerResponse } from "http";

const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || "http://localhost:3008";

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

async function proxyTo(path: string, method: string, body?: string): Promise<unknown> {
  const opts: RequestInit = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = body;
  const response = await fetch(`${NOTIFICATIONS_SERVICE_URL}${path}`, opts);
  return response.json();
}

export async function handleNotifications(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const targetPath = url.pathname.replace("/api/notifications", "") || "/notifications";
  const fullPath = targetPath + url.search;

  try {
    if (req.method === "GET") {
      if (fullPath.startsWith("/notifications") || fullPath.startsWith("/preferences")) {
        const result = await proxyTo(fullPath, "GET");
        return sendJSON(res, 200, result);
      }
    }

    if (req.method === "PUT" && fullPath.startsWith("/preferences")) {
      const body = await readBody(req);
      const result = await proxyTo(fullPath, "PUT", body);
      return sendJSON(res, 200, result);
    }

    if (req.method === "POST") {
      const body = await readBody(req);

      if (targetPath === "/send" || targetPath === "/notifications/send") {
        const result = await proxyTo("/send", "POST", body);
        return sendJSON(res, 201, result);
      }

      if (targetPath === "/broadcast" || targetPath === "/notifications/broadcast") {
        const result = await proxyTo("/broadcast", "POST", body);
        return sendJSON(res, 201, result);
      }

      if (targetPath.endsWith("/read") || targetPath.endsWith("/read-all")) {
        const svcPath = targetPath.replace("/notifications", "");
        const result = await proxyTo(`/notifications${svcPath}`, "POST", body);
        return sendJSON(res, 200, result);
      }
    }
  } catch (err: any) {
    return sendJSON(res, 502, { error: `Notifications service unavailable: ${err?.message}` });
  }

  sendJSON(res, 404, { error: "Notifications endpoint not found" });
}

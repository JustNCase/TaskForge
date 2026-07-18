import type { IncomingMessage, ServerResponse } from "http";

const EVENTS_SERVICE_URL = process.env.EVENTS_SERVICE_URL || "http://localhost:3007";

function sendJSON(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

async function proxyRequest(method: string, path: string, body?: string): Promise<unknown> {
  const opts: RequestInit = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = body;
  const response = await fetch(`${EVENTS_SERVICE_URL}${path}`, opts);
  return response.json();
}

export async function handleEvents(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const path = url.pathname.replace("/api/events", "") || "/events";
  const query = url.search;

  try {
    if ((path === "/publish" || path === "/events/publish") && req.method === "POST") {
      const body = await readBody(req);
      const result = await proxyRequest("POST", "/publish", body);
      return sendJSON(res, 201, result);
    }

    if ((path === "" || path === "/" || path === "/events") && req.method === "GET") {
      const result = await proxyRequest("GET", `/events${query}`);
      return sendJSON(res, 200, result);
    }

    if (path.startsWith("/events/") && req.method === "GET") {
      const result = await proxyRequest("GET", path);
      return sendJSON(res, 200, result);
    }

    if (path === "/events/clear" && req.method === "DELETE") {
      const result = await proxyRequest("DELETE", "/events/clear");
      return sendJSON(res, 200, result);
    }
  } catch (err: any) {
    return sendJSON(res, 502, { error: `Events service unavailable: ${err?.message}` });
  }

  sendJSON(res, 404, { error: "Events endpoint not found" });
}

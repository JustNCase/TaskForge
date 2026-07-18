import type { IncomingMessage, ServerResponse } from "http";

const VISION_SERVICE_URL = process.env.VISION_SERVICE_URL || "http://localhost:3005";

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

async function proxyToVision(path: string, req: IncomingMessage): Promise<unknown> {
  const body = await readBody(req);
  const response = await fetch(`${VISION_SERVICE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return response.json();
}

export async function handleVision(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const path = url.pathname.replace("/api/vision", "");

  try {
    if (path === "/detect/objects" && req.method === "POST") {
      const result = await proxyToVision("/detect/objects", req);
      return sendJSON(res, 200, result);
    }

    if (path === "/detect/faces" && req.method === "POST") {
      const result = await proxyToVision("/detect/faces", req);
      return sendJSON(res, 200, result);
    }

    if (path === "/analyze/scene" && req.method === "POST") {
      const result = await proxyToVision("/analyze/scene", req);
      return sendJSON(res, 200, result);
    }

    if (path === "/recognize/gestures" && req.method === "POST") {
      const result = await proxyToVision("/recognize/gestures", req);
      return sendJSON(res, 200, result);
    }
  } catch (err: any) {
    return sendJSON(res, 502, { error: `Vision service unavailable: ${err?.message}` });
  }

  sendJSON(res, 404, { error: "Vision endpoint not found" });
}

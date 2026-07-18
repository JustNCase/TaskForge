import type { IncomingMessage, ServerResponse } from "http";

const INTEGRATION_SERVICE_URL = process.env.INTEGRATION_SERVICE_URL || "http://localhost:3006";

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

async function proxyToIntegration(path: string, req: IncomingMessage): Promise<unknown> {
  const body = await readBody(req);
  const response = await fetch(`${INTEGRATION_SERVICE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return response.json();
}

export async function handleIntegration(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const path = url.pathname.replace("/api/integration", "");

  const endpoints = [
    "/github/issues", "/github/issues/create", "/github/pulls", "/github/repo",
    "/slack/send", "/slack/history",
    "/calendar/events", "/calendar/events/create",
    "/jira/search",
  ];

  try {
    if (endpoints.includes(path) && req.method === "POST") {
      const result = await proxyToIntegration(path, req);
      return sendJSON(res, 200, result);
    }
  } catch (err: any) {
    return sendJSON(res, 502, { error: `Integration service unavailable: ${err?.message}` });
  }

  sendJSON(res, 404, { error: "Integration endpoint not found" });
}

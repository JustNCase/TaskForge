import type { IncomingMessage, ServerResponse } from "http";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:3003";

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

async function proxyToAI(path: string, method: string, body?: string): Promise<unknown> {
  const opts: RequestInit = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = body;
  const response = await fetch(`${AI_SERVICE_URL}${path}`, opts);
  return response.json();
}

const POST_ENDPOINTS = [
  "/chat", "/chat/context", "/chat/summarize",
  "/multimodal", "/analyze", "/nlp", "/sentiment", "/predict",
  "/embed", "/embed/batch", "/embed/search",
];

const GET_ENDPOINTS = ["/models/tf"];

export async function handleAI(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const path = url.pathname.replace("/api/ai", "");

  try {
    if (GET_ENDPOINTS.includes(path) && req.method === "GET") {
      const result = await proxyToAI(path, "GET");
      return sendJSON(res, 200, result);
    }

    if (POST_ENDPOINTS.includes(path) && req.method === "POST") {
      const body = await readBody(req);
      const result = await proxyToAI(path, "POST", body);
      return sendJSON(res, 200, result);
    }
  } catch (err: any) {
    return sendJSON(res, 502, { error: `AI service unavailable: ${err?.message}` });
  }

  sendJSON(res, 404, { error: "AI endpoint not found" });
}

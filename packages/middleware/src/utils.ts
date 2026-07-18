import type { IncomingMessage, ServerResponse } from "http";

export function sendJSON(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

export function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

export function readJSON(req: IncomingMessage): Promise<any> {
  return readBody(req).then((body) => JSON.parse(body));
}

export function getQueryParams(req: IncomingMessage): URLSearchParams {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  return url.searchParams;
}

export function getPathParam(req: IncomingMessage, prefix: string): string | null {
  const path = req.url?.split("?")[0] || "";
  if (!path.startsWith(prefix)) return null;
  return path.slice(prefix.length) || null;
}

export function compose(...middlewares: Array<(req: IncomingMessage, res: ServerResponse, next: () => void) => void>) {
  return function composed(req: IncomingMessage, res: ServerResponse, done: () => void): void {
    let index = 0;
    function next(): void {
      if (index >= middlewares.length) {
        return done();
      }
      const middleware = middlewares[index++];
      middleware(req, res, next);
    }
    next();
  };
}

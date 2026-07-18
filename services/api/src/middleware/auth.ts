import type { IncomingMessage, ServerResponse } from "http";

export function authMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void): void {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.writeHead(401);
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }
  next();
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(req: IncomingMessage, res: ServerResponse, next: () => void): void {
  const ip = req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 100;

  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (entry.count >= maxRequests) {
    res.writeHead(429);
    res.end(JSON.stringify({ error: "Rate limit exceeded" }));
    return;
  }

  entry.count++;
  next();
}

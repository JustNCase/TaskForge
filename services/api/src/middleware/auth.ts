import type { IncomingMessage, ServerResponse } from "http";
import { JWTManager } from "@taskforge/security";

let jwtManager: JWTManager | null = null;

function getJWTManager(): JWTManager {
  if (!jwtManager) {
    jwtManager = new JWTManager();
  }
  return jwtManager;
}

export interface AuthenticatedRequest extends IncomingMessage {
  user?: {
    sub: string;
    role?: string;
    email?: string;
  };
}

export function authMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void): void {
  if (req.method === "OPTIONS") {
    return next();
  }

  const url = req.url?.split("?")[0] || "/";
  const publicRoutes = ["/health", "/auth/login", "/auth/register", "/auth/demo-login"];
  if (publicRoutes.includes(url)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing or invalid Authorization header" }));
    return;
  }

  const token = authHeader.slice(7);
  const payload = getJWTManager().verify(token);
  if (!payload) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid or expired token" }));
    return;
  }

  (req as AuthenticatedRequest).user = payload;
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
    res.writeHead(429, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Rate limit exceeded" }));
    return;
  }

  entry.count++;
  next();
}

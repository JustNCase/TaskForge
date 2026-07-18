import type { IncomingMessage, ServerResponse } from "http";
import { JWTManager } from "@taskforge/security";
import type { JWTPayload } from "@taskforge/security";

export interface AuthenticatedRequest extends IncomingMessage {
  user?: JWTPayload;
}

let jwtManager: JWTManager | null = null;

function getJWTManager(): JWTManager {
  if (!jwtManager) {
    jwtManager = new JWTManager();
  }
  return jwtManager;
}

export function createAuthMiddleware(options?: { publicRoutes?: string[] }) {
  const publicRoutes = new Set(options?.publicRoutes || ["/health"]);

  return function authMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ): void {
    if (req.method === "OPTIONS") {
      return next();
    }

    const url = req.url?.split("?")[0] || "/";
    if (publicRoutes.has(url)) {
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
  };
}

export function requireRole(...roles: string[]) {
  return function roleMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ): void {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    if (user.role && !roles.includes(user.role)) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Forbidden: insufficient permissions" }));
      return;
    }

    next();
  };
}

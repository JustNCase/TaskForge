import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "events";
import type { IncomingMessage, ServerResponse } from "http";

process.env.JWT_SECRET = "test-secret-for-auth-middleware-tests";

import { createAuthMiddleware, requireRole } from "../auth";
import type { AuthenticatedRequest } from "../auth";
import { JWTManager } from "@taskforge/security";

const jwt = new JWTManager("test-secret-for-auth-middleware-tests");

function createMockReq(options: { url?: string; method?: string; headers?: Record<string, string> } = {}): IncomingMessage {
  const req = new EventEmitter() as IncomingMessage;
  req.url = options.url || "/";
  req.method = options.method || "GET";
  req.headers = options.headers || {};
  (req as any).socket = { remoteAddress: "127.0.0.1" };
  return req;
}

function createMockRes() {
  const res = {
    _status: 200,
    _body: null as any,
    writeHead: vi.fn((status: number) => { res._status = status; }),
    setHeader: vi.fn(),
    end: vi.fn((body?: string) => {
      if (body) {
        try { res._body = JSON.parse(body); } catch { res._body = body; }
      }
    }),
  };
  return res as unknown as ServerResponse & { _status: number; _body: any };
}

describe("createAuthMiddleware", () => {
  it("passes through public routes without token", () => {
    const auth = createAuthMiddleware({ publicRoutes: ["/health"] });
    const req = createMockReq({ url: "/health" });
    const res = createMockRes();
    const next = vi.fn();
    auth(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("returns 401 when missing auth header", () => {
    const auth = createAuthMiddleware();
    const req = createMockReq({ url: "/protected" });
    const res = createMockRes();
    const next = vi.fn();
    auth(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });

  it("returns 401 for invalid token", () => {
    const auth = createAuthMiddleware();
    const req = createMockReq({ url: "/protected", headers: { authorization: "Bearer totally-invalid" } });
    const res = createMockRes();
    const next = vi.fn();
    auth(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });

  it("passes with valid token and sets req.user", () => {
    const auth = createAuthMiddleware();
    const token = jwt.sign({ sub: "user-123", role: "admin", email: "test@example.com" });
    const req = createMockReq({ url: "/protected", headers: { authorization: `Bearer ${token}` } });
    const res = createMockRes();
    const next = vi.fn();
    auth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as AuthenticatedRequest).user).toBeDefined();
    expect((req as AuthenticatedRequest).user!.sub).toBe("user-123");
  });

  it("returns 401 for expired token", () => {
    const auth = createAuthMiddleware();
    const token = jwt.sign({ sub: "user-123" }, { expiresIn: -1000 });
    const req = createMockReq({ url: "/protected", headers: { authorization: `Bearer ${token}` } });
    const res = createMockRes();
    const next = vi.fn();
    auth(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });

  it("bypasses auth for OPTIONS requests", () => {
    const auth = createAuthMiddleware();
    const req = createMockReq({ url: "/protected", method: "OPTIONS" });
    const res = createMockRes();
    const next = vi.fn();
    auth(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe("requireRole", () => {
  it("passes when user has matching role", () => {
    const roleMiddleware = requireRole("admin");
    const req = createMockReq();
    (req as AuthenticatedRequest).user = { sub: "u1", role: "admin", iat: 0, exp: 9999999999 };
    const res = createMockRes();
    const next = vi.fn();
    roleMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("returns 403 when user has non-matching role", () => {
    const roleMiddleware = requireRole("admin");
    const req = createMockReq();
    (req as AuthenticatedRequest).user = { sub: "u1", role: "viewer", iat: 0, exp: 9999999999 };
    const res = createMockRes();
    const next = vi.fn();
    roleMiddleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
  });
});

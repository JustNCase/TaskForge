import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "events";
import type { IncomingMessage, ServerResponse } from "http";
import { createRateLimitMiddleware } from "../rate-limit";

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
    _headers: {} as Record<string, string>,
    writeHead: vi.fn((status: number, headers?: Record<string, string>) => {
      res._status = status;
      if (headers) Object.assign(res._headers, headers);
    }),
    setHeader: vi.fn((name: string, value: string | number) => {
      res._headers[name] = String(value);
    }),
    end: vi.fn(),
  };
  return res as unknown as ServerResponse & { _status: number; _headers: Record<string, string> };
}

describe("createRateLimitMiddleware", () => {
  it("passes the first request", () => {
    const rl = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 5 });
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();
    rl(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("rate limits after max requests", () => {
    const rl = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 3 });
    const next = vi.fn();
    for (let i = 0; i < 3; i++) {
      rl(createMockReq(), createMockRes(), vi.fn());
    }
    const res = createMockRes();
    rl(createMockReq(), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(429);
  });

  it("sets X-RateLimit headers", () => {
    const rl = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 10 });
    const req = createMockReq();
    const res = createMockRes();
    rl(req, res, vi.fn());
    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 10);
    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", 9);
    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Reset", expect.any(Number));
  });

  it("sets Retry-After header when limit reached", () => {
    const rl = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 2 });
    const res = createMockRes();
    rl(createMockReq(), res, vi.fn());
    rl(createMockReq(), res, vi.fn());
    rl(createMockReq(), res, vi.fn());
    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(Number));
  });

  it("OPTIONS requests bypass rate limit", () => {
    const rl = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 1 });
    const res = createMockRes();
    rl(createMockReq({ method: "OPTIONS" }), res, vi.fn());
    rl(createMockReq({ method: "OPTIONS" }), res, vi.fn());
    rl(createMockReq({ method: "OPTIONS" }), res, vi.fn());
    expect(res._status).not.toBe(429);
  });

  it("differentiates by api-key mode", () => {
    const rl = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 2, keyBy: "api-key" });
    const res = createMockRes();
    rl(createMockReq({ headers: { "x-api-key": "key-1" } }), res, vi.fn());
    rl(createMockReq({ headers: { "x-api-key": "key-1" } }), res, vi.fn());
    rl(createMockReq({ headers: { "x-api-key": "key-1" } }), res, vi.fn());
    expect(res._status).toBe(429);
    const res2 = createMockRes();
    rl(createMockReq({ headers: { "x-api-key": "key-2" } }), res2, vi.fn());
    expect(res2._status).not.toBe(429);
  });
});

import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "events";
import type { IncomingMessage, ServerResponse } from "http";
import { sendJSON, getQueryParams, getPathParam, compose } from "../utils";

function createMockReq(url: string, headers?: Record<string, string>): IncomingMessage {
  const req = new EventEmitter() as IncomingMessage;
  req.url = url;
  req.method = "GET";
  req.headers = { host: "localhost:3000", ...headers };
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

describe("sendJSON", () => {
  it("sets correct status and content-type", () => {
    const res = createMockRes();
    sendJSON(res, 201, { ok: true });
    expect(res.writeHead).toHaveBeenCalledWith(201, { "Content-Type": "application/json" });
    expect(res._body).toEqual({ ok: true });
  });
});

describe("getQueryParams", () => {
  it("parses URL query parameters correctly", () => {
    const req = createMockReq("/api/items?page=2&limit=10&sort=asc");
    const params = getQueryParams(req);
    expect(params.get("page")).toBe("2");
    expect(params.get("limit")).toBe("10");
    expect(params.get("sort")).toBe("asc");
  });
});

describe("getPathParam", () => {
  it("extracts path segment after prefix and returns null for non-matching", () => {
    const req1 = createMockReq("/api/users/123");
    expect(getPathParam(req1, "/api/users/")).toBe("123");

    const req2 = createMockReq("/api/items/123");
    expect(getPathParam(req2, "/api/users/")).toBeNull();
  });
});

describe("compose", () => {
  it("calls middlewares in order", () => {
    const order: number[] = [];
    const m1 = vi.fn((_req: any, _res: any, next: () => void) => { order.push(1); next(); });
    const m2 = vi.fn((_req: any, _res: any, next: () => void) => { order.push(2); next(); });
    const m3 = vi.fn((_req: any, _res: any, next: () => void) => { order.push(3); next(); });
    const composed = compose(m1, m2, m3);
    const req = createMockReq("/");
    const res = createMockRes();
    const done = vi.fn();
    composed(req, res, done);
    expect(order).toEqual([1, 2, 3]);
    expect(done).toHaveBeenCalled();
  });

  it("stops at middleware that does not call next", () => {
    const order: number[] = [];
    const m1 = vi.fn((_req: any, _res: any, next: () => void) => { order.push(1); next(); });
    const m2 = vi.fn((_req: any, _res: any, _next: () => void) => { order.push(2); });
    const m3 = vi.fn((_req: any, _res: any, next: () => void) => { order.push(3); next(); });
    const composed = compose(m1, m2, m3);
    const req = createMockReq("/");
    const res = createMockRes();
    const done = vi.fn();
    composed(req, res, done);
    expect(order).toEqual([1, 2]);
    expect(done).not.toHaveBeenCalled();
  });
});

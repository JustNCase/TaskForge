import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "events";
import type { IncomingMessage, ServerResponse } from "http";
import { createCorsMiddleware } from "../cors";

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

describe("createCorsMiddleware", () => {
  it("sets allowed origin for matching origin", () => {
    const cors = createCorsMiddleware({ origin: ["http://localhost:3000"] });
    const req = createMockReq({ headers: { origin: "http://localhost:3000" } });
    const res = createMockRes();
    const next = vi.fn();
    cors(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "http://localhost:3000");
    expect(next).toHaveBeenCalled();
  });

  it("does not set origin for disallowed origin", () => {
    const cors = createCorsMiddleware({ origin: ["http://localhost:3000"] });
    const req = createMockReq({ headers: { origin: "http://evil.com" } });
    const res = createMockRes();
    const next = vi.fn();
    cors(req, res, next);
    const originCalls = (res.setHeader as ReturnType<typeof vi.fn>).mock.calls.filter((c: any[]) => c[0] === "Access-Control-Allow-Origin");
    expect(originCalls.length).toBe(0);
    expect(next).toHaveBeenCalled();
  });

  it("returns 204 for OPTIONS preflight", () => {
    const cors = createCorsMiddleware();
    const req = createMockReq({ method: "OPTIONS", headers: { origin: "http://localhost:3000" } });
    const res = createMockRes();
    cors(req, res, vi.fn());
    expect(res._status).toBe(204);
  });

  it("sets CORS headers properly on preflight", () => {
    const cors = createCorsMiddleware({ origin: ["http://localhost:3000"] });
    const req = createMockReq({ method: "OPTIONS", headers: { origin: "http://localhost:3000" } });
    const res = createMockRes();
    cors(req, res, vi.fn());
    expect(res.writeHead).toHaveBeenCalledWith(204, expect.objectContaining({
      "Access-Control-Allow-Methods": expect.stringContaining("GET"),
      "Access-Control-Allow-Headers": expect.stringContaining("Content-Type"),
      "Access-Control-Max-Age": expect.any(String),
    }));
  });

  it("sets credentials header", () => {
    const cors = createCorsMiddleware({ credentials: true });
    const req = createMockReq({ headers: { origin: "http://localhost:3000" } });
    const res = createMockRes();
    cors(req, res, vi.fn());
    expect(res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Credentials", "true");
  });
});

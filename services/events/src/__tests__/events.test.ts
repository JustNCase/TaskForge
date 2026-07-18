import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";
import type { IncomingMessage, ServerResponse } from "http";

const { capturedHandler } = vi.hoisted(() => {
  let capturedHandler: ((req: IncomingMessage, res: ServerResponse) => any) | undefined;
  return { capturedHandler: { get current() { return capturedHandler; }, set current(v) { capturedHandler = v; } } };
});

vi.mock("http", async () => {
  const actual = await vi.importActual("http");
  return {
    ...actual,
    createServer: (handler: any) => {
      capturedHandler.current = handler;
      return { listen: vi.fn(), close: vi.fn() };
    },
  };
});

vi.mock("ws", () => ({
  WebSocketServer: vi.fn().mockImplementation(() => ({ on: vi.fn() })),
  WebSocket: { OPEN: 1 },
}));

vi.mock("@taskforge/middleware", () => ({
  createAuthMiddleware: () => (req: any, res: any, next: () => void) => next(),
  createRateLimitMiddleware: () => (req: any, res: any, next: () => void) => next(),
  createCorsMiddleware: () => (req: any, res: any, next: () => void) => next(),
  sendJSON: (res: any, status: number, data: any) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  },
  readBody: (req: any) =>
    new Promise((resolve) => {
      let body = "";
      req.on("data", (chunk: Buffer) => (body += chunk));
      req.on("end", () => resolve(body));
    }),
}));

vi.mock("@taskforge/database", () => ({
  getServerClient: () => null,
  findAll: vi.fn().mockResolvedValue([]),
  insert: vi.fn().mockResolvedValue({}),
  remove: vi.fn().mockResolvedValue({}),
}));

import "../index";

function createMockReq(url: string, options?: { method?: string; body?: any }): IncomingMessage {
  const req = new EventEmitter() as IncomingMessage;
  req.url = url;
  req.method = options?.method || "GET";
  req.headers = { host: "localhost:3007" };
  (req as any).socket = { remoteAddress: "127.0.0.1" };
  if (options?.body !== undefined) {
    const bodyStr = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    process.nextTick(() => {
      req.emit("data", Buffer.from(bodyStr));
      req.emit("end");
    });
  }
  return req;
}

function createMockRes() {
  const res = {
    _status: 200,
    _body: null as any,
    writeHead: vi.fn((status: number) => {
      res._status = status;
    }),
    setHeader: vi.fn(),
    end: vi.fn((body?: string) => {
      if (body) {
        try {
          res._body = JSON.parse(body.toString());
        } catch {
          res._body = body;
        }
      }
    }),
  };
  return res as unknown as ServerResponse & { _status: number; _body: any };
}

async function makeRequest(url: string, options?: { method?: string; body?: any }) {
  const req = createMockReq(url, options);
  const res = createMockRes();
  capturedHandler.current!(req, res);
  await vi.waitFor(() => {
    expect(res.end).toHaveBeenCalled();
  }, { timeout: 5000 });
  return { req, res };
}

describe("Events Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("publish creates an event", async () => {
    const { res } = await makeRequest("/publish", {
      method: "POST",
      body: { type: "task.completed", source: "api", data: { taskId: "123" } },
    });
    expect(res._body.event).toBeDefined();
    expect(res._body.event.type).toBe("task.completed");
    expect(res._body.event.source).toBe("api");
    expect(res._body.event.id).toBeDefined();
  });

  it("list filters events by type", async () => {
    await makeRequest("/publish", { method: "POST", body: { type: "task.created", data: {} } });
    await makeRequest("/publish", { method: "POST", body: { type: "task.completed", data: {} } });
    await makeRequest("/publish", { method: "POST", body: { type: "task.created", data: {} } });
    const { res } = await makeRequest("/events?type=task.created");
    expect(res._body.events.length).toBe(2);
    expect(res._body.events.every((e: any) => e.type === "task.created")).toBe(true);
  });

  it("clear removes all events", async () => {
    await makeRequest("/publish", { method: "POST", body: { type: "test.event", data: {} } });
    await makeRequest("/events/clear", { method: "DELETE" });
    const { res } = await makeRequest("/events");
    expect(res._body.events.length).toBe(0);
  });
});

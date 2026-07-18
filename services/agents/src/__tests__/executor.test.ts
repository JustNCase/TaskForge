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

import "../index";

function createMockReq(
  url: string,
  options?: { method?: string; body?: any },
): IncomingMessage {
  const req = new EventEmitter() as IncomingMessage;
  req.url = url;
  req.method = options?.method || "GET";
  req.headers = { host: "localhost:3011" };
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

describe("Agent Executor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns expected output types for different agent types", async () => {
    const createRes = await makeRequest("/agents", {
      method: "POST",
      body: { name: "Research Executor", type: "research" },
    });
    const id = createRes.res._body.agent.id;
    const runRes = await makeRequest(`/agents/${id}/run`, {
      method: "POST",
      body: { input: { topic: "AI trends" } },
    });
    expect(runRes.res._body.run.output.summary).toBeDefined();
    expect(runRes.res._body.run.output.findings).toBeDefined();
    expect(Array.isArray(runRes.res._body.run.output.findings)).toBe(true);
  });

  it("tracks token usage in run results", async () => {
    const createRes = await makeRequest("/agents", {
      method: "POST",
      body: { name: "Token Agent", type: "assistant" },
    });
    const id = createRes.res._body.agent.id;
    const runRes = await makeRequest(`/agents/${id}/run`, {
      method: "POST",
      body: { input: { message: "hello" } },
    });
    expect(runRes.res._body.run.tokensUsed).toBeGreaterThan(0);
    expect(runRes.res._body.run.cost).toBeGreaterThanOrEqual(0);
    expect(runRes.res._body.run.duration).toBeGreaterThan(0);
  });

  it("handles execution errors gracefully", async () => {
    const createRes = await makeRequest("/agents", {
      method: "POST",
      body: { name: "Error Agent", type: "automation" },
    });
    const id = createRes.res._body.agent.id;
    const runRes = await makeRequest(`/agents/${id}/run`, {
      method: "POST",
      body: { input: {} },
    });
    expect(runRes.res._body.run.error).toBeNull();
    expect(runRes.res._body.run.status).toBe("completed");
  });

  it("completes execution within reasonable timeout", async () => {
    const createRes = await makeRequest("/agents", {
      method: "POST",
      body: { name: "Timeout Agent", type: "monitoring" },
    });
    const id = createRes.res._body.agent.id;
    const start = Date.now();
    const runRes = await makeRequest(`/agents/${id}/run`, {
      method: "POST",
      body: { input: {} },
    });
    const elapsed = Date.now() - start;
    expect(runRes.res._body.run.status).toBe("completed");
    expect(elapsed).toBeLessThan(5000);
  });
});

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
  options?: { method?: string; headers?: Record<string, string>; body?: any },
): IncomingMessage {
  const req = new EventEmitter() as IncomingMessage;
  req.url = url;
  req.method = options?.method || "GET";
  req.headers = { host: "localhost:3011", ...options?.headers };
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

async function makeRequest(
  url: string,
  options?: { method?: string; headers?: Record<string, string>; body?: any },
) {
  const req = createMockReq(url, options);
  const res = createMockRes();
  capturedHandler.current!(req, res);
  await vi.waitFor(() => {
    expect(res.end).toHaveBeenCalled();
  }, { timeout: 5000 });
  return { req, res };
}

describe("Agent Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates agent from template with defaults", async () => {
    const { res } = await makeRequest("/agents", {
      method: "POST",
      body: { name: "My Research Agent", type: "research", templateId: "tpl_research" },
    });
    expect(res._body.agent).toBeDefined();
    expect(res._body.agent.name).toBe("My Research Agent");
    expect(res._body.agent.model).toBe("gpt-4o-mini");
    expect(res._body.agent.tools).toEqual(["web_search", "citation_manager", "document_reader"]);
  });

  it("agent execution produces output", async () => {
    const createRes = await makeRequest("/agents", {
      method: "POST",
      body: { name: "Test Agent", type: "analysis" },
    });
    const agentId = createRes.res._body.agent.id;
    const runRes = await makeRequest(`/agents/${agentId}/run`, {
      method: "POST",
      body: { input: { topic: "test analysis" } },
    });
    expect(runRes.res._body.run).toBeDefined();
    expect(runRes.res._body.run.status).toBe("completed");
    expect(runRes.res._body.run.output).toBeDefined();
  });

  it("template engine returns all templates", async () => {
    const { res } = await makeRequest("/templates");
    expect(res._body.templates).toBeDefined();
    expect(res._body.templates.length).toBe(6);
    expect(res._body.count).toBe(6);
  });

  it("agent status transitions idle -> running -> completed", async () => {
    const createRes = await makeRequest("/agents", {
      method: "POST",
      body: { name: "Status Agent", type: "assistant" },
    });
    const agentId = createRes.res._body.agent.id;
    expect(createRes.res._body.agent.status).toBe("idle");

    const runRes = await makeRequest(`/agents/${agentId}/run`, {
      method: "POST",
      body: { input: {} },
    });
    expect(runRes.res._body.run.status).toBe("completed");

    const getRes = await makeRequest(`/agents/${agentId}`);
    expect(getRes.res._body.agent.status).toBe("idle");
    expect(getRes.res._body.agent.runCount).toBe(1);
  });

  it("pause and resume agent", async () => {
    const createRes = await makeRequest("/agents", {
      method: "POST",
      body: { name: "Pause Agent", type: "monitoring" },
    });
    const agentId = createRes.res._body.agent.id;

    const pauseRes = await makeRequest(`/agents/${agentId}/pause`, { method: "POST" });
    expect(pauseRes.res._body.agent.status).toBe("paused");

    const resumeRes = await makeRequest(`/agents/${agentId}/resume`, { method: "POST" });
    expect(resumeRes.res._body.agent.status).toBe("idle");
  });

  it("analytics aggregation", async () => {
    const createRes = await makeRequest("/agents", {
      method: "POST",
      body: { name: "Analytics Agent", type: "research" },
    });
    const agentId = createRes.res._body.agent.id;
    await makeRequest(`/agents/${agentId}/run`, { method: "POST", body: { input: {} } });

    const { res } = await makeRequest("/agents/analytics/summary");
    expect(res._body.total).toBeGreaterThanOrEqual(1);
    expect(res._body.byType).toBeDefined();
    expect(res._body.totalRuns).toBeGreaterThanOrEqual(1);
    expect(res._body.totalTokens).toBeGreaterThanOrEqual(0);
  });
});

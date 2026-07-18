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
  getQueryParams: (req: any) => new URL(req.url || "/", `http://${req.headers.host}`).searchParams,
}));

vi.mock("@taskforge/database", () => ({
  getServerClient: () => null,
}));

import "../index";

function createMockReq(
  url: string,
  options?: { method?: string; headers?: Record<string, string>; body?: any },
): IncomingMessage {
  const req = new EventEmitter() as IncomingMessage;
  req.url = url;
  req.method = options?.method || "GET";
  req.headers = { host: "localhost:3007", ...options?.headers };
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

describe("Opportunity Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scores an opportunity with high-value keywords", async () => {
    const { res } = await makeRequest("/opportunities", {
      method: "POST",
      body: {
        title: "Enterprise AI Cloud Solution",
        description: "SaaS machine learning consulting",
        source: "linkedin",
        estimatedValue: 25000,
      },
    });
    expect(res._body.score).toBeGreaterThan(50);
    expect(res._body.confidence).toBeGreaterThan(0);
  });

  it("search generates results", async () => {
    const { res } = await makeRequest("/opportunities/search", {
      method: "POST",
      body: { query: "cloud consulting" },
    });
    expect(res._body.opportunities).toBeDefined();
    expect(res._body.opportunities.length).toBeGreaterThan(0);
    expect(res._body.aiSummary).toBeDefined();
  });

  it("confidence calculation is within valid range", async () => {
    const { res } = await makeRequest("/opportunities", {
      method: "POST",
      body: { title: "Small Task", description: "Simple job", source: "manual" },
    });
    expect(res._body.confidence).toBeGreaterThanOrEqual(0);
    expect(res._body.confidence).toBeLessThanOrEqual(1);
  });

  it("import detects duplicates by title", async () => {
    await makeRequest("/opportunities", {
      method: "POST",
      body: { title: "Unique Opportunity", description: "Test" },
    });
    const { res } = await makeRequest("/opportunities/import", {
      method: "POST",
      body: {
        source: "manual",
        items: [
          { title: "Unique Opportunity", description: "Duplicate" },
          { title: "Brand New Opportunity", description: "Not duplicate" },
        ],
      },
    });
    expect(res._body.imported).toBe(1);
    expect(res._body.skipped).toBe(1);
  });

  it("analytics summary calculation", async () => {
    await makeRequest("/opportunities", { method: "POST", body: { title: "Analytics A", source: "linkedin" } });
    await makeRequest("/opportunities", { method: "POST", body: { title: "Analytics B", source: "manual" } });
    const { res } = await makeRequest("/opportunities/analytics/summary");
    expect(res._body.total).toBeGreaterThanOrEqual(2);
    expect(res._body.byStatus).toBeDefined();
    expect(res._body.avgConfidence).toBeGreaterThanOrEqual(0);
  });

  it("status transitions on update", async () => {
    const createRes = await makeRequest("/opportunities", {
      method: "POST",
      body: { title: "Status Test", description: "Test" },
    });
    const id = createRes.res._body.id;
    const updateRes = await makeRequest(`/opportunities/${id}`, {
      method: "PUT",
      body: { status: "pursuing" },
    });
    expect(updateRes.res._body.status).toBe("pursuing");
  });
});

import { createServer, IncomingMessage, ServerResponse } from "http";
import {
  createAuthMiddleware,
  createRateLimitMiddleware,
  createCorsMiddleware,
  sendJSON,
  readBody,
} from "@taskforge/middleware";

const PORT = parseInt(process.env.AGENTS_PORT || "3011");

interface Agent {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: "research" | "analysis" | "automation" | "monitoring" | "assistant";
  model: string;
  status: "idle" | "running" | "paused" | "error" | "completed";
  config: Record<string, unknown>;
  systemPrompt: string;
  tools: string[];
  schedule: string | null;
  lastRunAt: string | null;
  lastError: string | null;
  runCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AgentRun {
  id: string;
  agentId: string;
  userId: string;
  status: "pending" | "running" | "completed" | "failed";
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  tokensUsed: number;
  cost: number;
}

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  type: Agent["type"];
  defaultModel: string;
  defaultSystemPrompt: string;
  defaultTools: string[];
  defaultConfig: Record<string, unknown>;
  category: string;
  popularity: number;
}

const agents = new Map<string, Agent>();
const runs = new Map<string, AgentRun[]>();
let agentCounter = 0;
let runCounter = 0;

const auth = createAuthMiddleware({ publicRoutes: ["/health"] });
const rateLimit = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 20 });
const cors = createCorsMiddleware();

class AgentTemplateEngine {
  private templates: AgentTemplate[] = [
    {
      id: "tpl_research",
      name: "Research Agent",
      description: "Conducts deep research on topics, compiles findings, and generates comprehensive reports.",
      type: "research",
      defaultModel: "gpt-4o-mini",
      defaultSystemPrompt: "You are a research assistant. Gather information, analyze sources, and produce well-structured reports with citations.",
      defaultTools: ["web_search", "citation_manager", "document_reader"],
      defaultConfig: { maxSources: 10, depth: "comprehensive" },
      category: "knowledge",
      popularity: 85,
    },
    {
      id: "tpl_code_review",
      name: "Code Review Agent",
      description: "Reviews code for quality, security vulnerabilities, and best practices compliance.",
      type: "analysis",
      defaultModel: "claude-3",
      defaultSystemPrompt: "You are a senior code reviewer. Analyze code for bugs, security issues, performance problems, and style violations.",
      defaultTools: ["code_analyzer", "security_scanner", "linter"],
      defaultConfig: { severity: "all", autoFix: false },
      category: "engineering",
      popularity: 92,
    },
    {
      id: "tpl_market_analysis",
      name: "Market Analysis Agent",
      description: "Analyzes market trends, competitor data, and generates actionable business insights.",
      type: "analysis",
      defaultModel: "gpt-4o",
      defaultSystemPrompt: "You are a market analyst. Analyze market data, identify trends, and provide actionable business recommendations.",
      defaultTools: ["data_fetcher", "chart_generator", "report_builder"],
      defaultConfig: { timeframe: "30d", competitors: 5 },
      category: "business",
      popularity: 78,
    },
    {
      id: "tpl_monitoring",
      name: "Monitoring Agent",
      description: "Continuously monitors systems, services, or metrics and alerts on anomalies.",
      type: "monitoring",
      defaultModel: "gpt-4o-mini",
      defaultSystemPrompt: "You are a monitoring agent. Watch for anomalies, performance degradation, and system health issues.",
      defaultTools: ["metric_reader", "alert_sender", "log_analyzer"],
      defaultConfig: { checkInterval: 60, alertThreshold: 0.8 },
      category: "operations",
      popularity: 88,
    },
    {
      id: "tpl_assistant",
      name: "Personal Assistant",
      description: "General-purpose AI assistant for scheduling, drafting, and task management.",
      type: "assistant",
      defaultModel: "gpt-4o",
      defaultSystemPrompt: "You are a helpful personal assistant. Help with scheduling, drafting emails, managing tasks, and providing information.",
      defaultTools: ["calendar", "email_draft", "task_manager", "web_search"],
      defaultConfig: { tone: "professional", timezone: "UTC" },
      category: "productivity",
      popularity: 95,
    },
    {
      id: "tpl_automation",
      name: "Workflow Automation Agent",
      description: "Automates repetitive business workflows and data processing tasks.",
      type: "automation",
      defaultModel: "gpt-4o-mini",
      defaultSystemPrompt: "You are a workflow automation agent. Streamline processes, eliminate repetitive tasks, and optimize workflows.",
      defaultTools: ["data_transformer", "api_caller", "file_processor"],
      defaultConfig: { retryOnFailure: true, maxRetries: 3 },
      category: "operations",
      popularity: 82,
    },
  ];

  list(): AgentTemplate[] {
    return [...this.templates];
  }

  getById(id: string): AgentTemplate | undefined {
    return this.templates.find((t) => t.id === id);
  }

  incrementPopularity(id: string): void {
    const t = this.templates.find((tpl) => tpl.id === id);
    if (t && t.popularity < 100) t.popularity++;
  }
}

class AgentExecutor {
  private modelCosts: Record<string, { input: number; output: number }> = {
    "gpt-4o": { input: 0.005, output: 0.015 },
    "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
    "claude-3": { input: 0.003, output: 0.015 },
  };

  async execute(agent: Agent, input: Record<string, unknown>): Promise<AgentRun> {
    const runId = `run_${++runCounter}_${Date.now()}`;
    const now = new Date().toISOString();
    const startedAt = Date.now();

    const run: AgentRun = {
      id: runId,
      agentId: agent.id,
      userId: agent.userId,
      status: "running",
      input,
      output: null,
      error: null,
      startedAt: now,
      completedAt: null,
      duration: null,
      tokensUsed: 0,
      cost: 0,
    };

    const agentRuns = runs.get(agent.id) || [];
    agentRuns.unshift(run);
    runs.set(agent.id, agentRuns);

    agent.status = "running";
    agent.lastRunAt = now;

    try {
      await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

      const output = this.generateMockOutput(agent, input);
      const tokensUsed = this.estimateTokens(JSON.stringify(input) + JSON.stringify(output));
      const cost = this.calculateCost(agent.model, tokensUsed);
      const duration = Date.now() - startedAt;

      run.status = "completed";
      run.output = output;
      run.completedAt = new Date().toISOString();
      run.duration = duration;
      run.tokensUsed = tokensUsed;
      run.cost = cost;

      agent.status = "idle";
      agent.runCount++;
    } catch (err: any) {
      run.status = "failed";
      run.error = err?.message || "Execution failed";
      run.completedAt = new Date().toISOString();
      run.duration = Date.now() - startedAt;
      agent.status = "error";
      agent.lastError = run.error;
    }

    agent.updatedAt = new Date().toISOString();
    return run;
  }

  private generateMockOutput(agent: Agent, input: Record<string, unknown>): Record<string, unknown> {
    const inputStr = JSON.stringify(input);
    const inputLength = inputStr.length;

    const outputsByType: Record<Agent["type"], () => Record<string, unknown>> = {
      research: () => ({
        summary: `Research completed on the provided topic. Analyzed ${Math.max(3, Math.floor(inputLength / 50))} sources.`,
        findings: [
          "Primary trend identified with strong supporting data",
          "Secondary patterns suggest emerging opportunity",
          "Competitive landscape shows consolidation movement",
        ],
        confidence: 0.87,
        sourcesAnalyzed: Math.floor(inputLength / 30) + 2,
      }),
      analysis: () => ({
        result: "Analysis complete",
        metrics: {
          score: Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
          factors: ["complexity", "impact", "feasibility"],
          recommendation: "Proceed with implementation",
        },
        breakdown: { positive: 3, neutral: 1, negative: 0 },
      }),
      automation: () => ({
        status: "completed",
        tasksExecuted: Math.floor(inputLength / 20) + 1,
        succeeded: Math.floor(inputLength / 20) + 1,
        failed: 0,
        executionLog: ["Task initialized", "Processing input data", "Applying transformation", "Output generated"],
        outputData: { processed: true, recordsHandled: Math.floor(inputLength / 10) },
      }),
      monitoring: () => ({
        status: "healthy",
        checks: [
          { name: "availability", status: "ok", value: 99.9 },
          { name: "latency", status: "ok", value: 45 },
          { name: "error_rate", status: "ok", value: 0.01 },
        ],
        alerts: [],
        nextCheck: new Date(Date.now() + 60000).toISOString(),
      }),
      assistant: () => ({
        response: `I've processed your request. Based on the input provided, here is a structured response addressing your needs.`,
        actions: ["Generated summary", "Identified key points", "Prepared next steps"],
        suggestions: ["Consider reviewing the output for accuracy", "Schedule a follow-up if needed"],
        confidence: 0.92,
      }),
    };

    return outputsByType[agent.type]();
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private calculateCost(model: string, totalTokens: number): number {
    const costs = this.modelCosts[model] || this.modelCosts["gpt-4o-mini"];
    const inputTokens = Math.floor(totalTokens * 0.4);
    const outputTokens = totalTokens - inputTokens;
    return Math.round((inputTokens * costs.input + outputTokens * costs.output) * 10000) / 10000;
  }
}

const templateEngine = new AgentTemplateEngine();
const executor = new AgentExecutor();

function getUserId(req: IncomingMessage): string {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const payload = JSON.parse(Buffer.from(authHeader.split(".")[1], "base64").toString());
      return payload.sub || payload.userId || "anonymous";
    } catch {
      return "anonymous";
    }
  }
  return "anonymous";
}

function parseQuery(req: IncomingMessage): URLSearchParams {
  return new URL(req.url || "/", `http://${req.headers.host}`).searchParams;
}

async function handleHealth(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  sendJSON(res, 200, {
    status: "ok",
    service: "taskforge-agents",
    agents: agents.size,
    totalRuns: Array.from(runs.values()).reduce((sum, r) => sum + r.length, 0),
    templates: templateEngine.list().length,
  });
}

async function handleCreateAgent(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = getUserId(req);
  const body = JSON.parse(await readBody(req));

  if (!body.name || !body.type) {
    return sendJSON(res, 400, { error: "Missing required fields: name, type" });
  }

  const validTypes: Agent["type"][] = ["research", "analysis", "automation", "monitoring", "assistant"];
  if (!validTypes.includes(body.type)) {
    return sendJSON(res, 400, { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` });
  }

  let agentConfig: Partial<Agent> = {
    name: body.name,
    description: body.description || "",
    type: body.type,
    model: body.model || "gpt-4o-mini",
    config: body.config || {},
    systemPrompt: body.systemPrompt || "",
    tools: body.tools || [],
    schedule: body.schedule || null,
  };

  if (body.templateId) {
    const template = templateEngine.getById(body.templateId);
    if (!template) {
      return sendJSON(res, 404, { error: "Template not found" });
    }
    templateEngine.incrementPopularity(body.templateId);
    agentConfig = {
      ...agentConfig,
      name: body.name || template.name,
      description: body.description || template.description,
      type: body.type || template.type,
      model: body.model || template.defaultModel,
      systemPrompt: body.systemPrompt || template.defaultSystemPrompt,
      tools: body.tools || template.defaultTools,
      config: { ...template.defaultConfig, ...body.config },
    };
  }

  const now = new Date().toISOString();
  const agent: Agent = {
    id: `agent_${++agentCounter}_${Date.now()}`,
    userId,
    name: agentConfig.name!,
    description: agentConfig.description!,
    type: agentConfig.type!,
    model: agentConfig.model!,
    status: "idle",
    config: agentConfig.config!,
    systemPrompt: agentConfig.systemPrompt!,
    tools: agentConfig.tools!,
    schedule: agentConfig.schedule!,
    lastRunAt: null,
    lastError: null,
    runCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  agents.set(agent.id, agent);
  sendJSON(res, 201, { agent });
}

async function handleListAgents(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = getUserId(req);
  const params = parseQuery(req);

  let userAgents = Array.from(agents.values()).filter((a) => a.userId === userId);

  const typeFilter = params.get("type");
  if (typeFilter) userAgents = userAgents.filter((a) => a.type === typeFilter);

  const statusFilter = params.get("status");
  if (statusFilter) userAgents = userAgents.filter((a) => a.status === statusFilter);

  const limit = Math.min(parseInt(params.get("limit") || "50"), 100);
  const offset = parseInt(params.get("offset") || "0");

  const paged = userAgents.slice(offset, offset + limit);

  sendJSON(res, 200, { agents: paged, total: userAgents.length, limit, offset });
}

async function handleGetAgent(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = getUserId(req);
  const id = req.url?.split("/")[2];

  if (!id) return sendJSON(res, 400, { error: "Missing agent id" });

  const agent = agents.get(id);
  if (!agent || agent.userId !== userId) {
    return sendJSON(res, 404, { error: "Agent not found" });
  }

  sendJSON(res, 200, { agent });
}

async function handleUpdateAgent(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = getUserId(req);
  const id = req.url?.split("/")[2];
  if (!id) return sendJSON(res, 400, { error: "Missing agent id" });

  const agent = agents.get(id);
  if (!agent || agent.userId !== userId) {
    return sendJSON(res, 404, { error: "Agent not found" });
  }

  const body = JSON.parse(await readBody(req));
  const allowed = ["name", "description", "model", "config", "systemPrompt", "tools", "schedule"] as const;

  for (const key of allowed) {
    if (body[key] !== undefined) {
      (agent as any)[key] = body[key];
    }
  }

  agent.updatedAt = new Date().toISOString();
  sendJSON(res, 200, { agent });
}

async function handleDeleteAgent(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = getUserId(req);
  const id = req.url?.split("/")[2];
  if (!id) return sendJSON(res, 400, { error: "Missing agent id" });

  const agent = agents.get(id);
  if (!agent || agent.userId !== userId) {
    return sendJSON(res, 404, { error: "Agent not found" });
  }

  agents.delete(id);
  runs.delete(id);
  sendJSON(res, 200, { ok: true, message: "Agent deleted" });
}

async function handleRunAgent(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = getUserId(req);
  const id = req.url?.split("/")[2];
  if (!id) return sendJSON(res, 400, { error: "Missing agent id" });

  const agent = agents.get(id);
  if (!agent || agent.userId !== userId) {
    return sendJSON(res, 404, { error: "Agent not found" });
  }

  if (agent.status === "running") {
    return sendJSON(res, 409, { error: "Agent is already running" });
  }

  if (agent.status === "paused") {
    return sendJSON(res, 400, { error: "Agent is paused. Resume it before running." });
  }

  const body = JSON.parse(await readBody(req));
  const input = body.input || {};

  const run = await executor.execute(agent, input);
  sendJSON(res, 200, { run });
}

async function handleListRuns(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = getUserId(req);
  const id = req.url?.split("/")[2];
  if (!id) return sendJSON(res, 400, { error: "Missing agent id" });

  const agent = agents.get(id);
  if (!agent || agent.userId !== userId) {
    return sendJSON(res, 404, { error: "Agent not found" });
  }

  const params = parseQuery(req);
  let agentRuns = runs.get(id) || [];

  const statusFilter = params.get("status");
  if (statusFilter) agentRuns = agentRuns.filter((r) => r.status === statusFilter);

  const limit = Math.min(parseInt(params.get("limit") || "20"), 100);
  const offset = parseInt(params.get("offset") || "0");
  const paged = agentRuns.slice(offset, offset + limit);

  sendJSON(res, 200, { runs: paged, total: agentRuns.length, limit, offset });
}

async function handleGetRun(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = getUserId(req);
  const parts = req.url?.split("/") || [];
  const agentId = parts[2];
  const runId = parts[4];

  if (!agentId || !runId) return sendJSON(res, 400, { error: "Missing agent id or run id" });

  const agent = agents.get(agentId);
  if (!agent || agent.userId !== userId) {
    return sendJSON(res, 404, { error: "Agent not found" });
  }

  const agentRuns = runs.get(agentId) || [];
  const run = agentRuns.find((r) => r.id === runId);
  if (!run) return sendJSON(res, 404, { error: "Run not found" });

  sendJSON(res, 200, { run });
}

async function handlePauseAgent(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = getUserId(req);
  const id = req.url?.split("/")[2];
  if (!id) return sendJSON(res, 400, { error: "Missing agent id" });

  const agent = agents.get(id);
  if (!agent || agent.userId !== userId) {
    return sendJSON(res, 404, { error: "Agent not found" });
  }

  if (agent.status === "running") {
    return sendJSON(res, 409, { error: "Cannot pause a running agent. Wait for it to complete." });
  }

  agent.status = "paused";
  agent.updatedAt = new Date().toISOString();
  sendJSON(res, 200, { agent });
}

async function handleResumeAgent(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = getUserId(req);
  const id = req.url?.split("/")[2];
  if (!id) return sendJSON(res, 400, { error: "Missing agent id" });

  const agent = agents.get(id);
  if (!agent || agent.userId !== userId) {
    return sendJSON(res, 404, { error: "Agent not found" });
  }

  if (agent.status !== "paused") {
    return sendJSON(res, 400, { error: "Agent is not paused" });
  }

  agent.status = "idle";
  agent.updatedAt = new Date().toISOString();
  sendJSON(res, 200, { agent });
}

async function handleTestAgent(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = getUserId(req);
  const id = req.url?.split("/")[2];
  if (!id) return sendJSON(res, 400, { error: "Missing agent id" });

  const agent = agents.get(id);
  if (!agent || agent.userId !== userId) {
    return sendJSON(res, 404, { error: "Agent not found" });
  }

  const body = JSON.parse(await readBody(req));
  const input = body.input || { test: true, message: "This is a dry run test" };

  const startTime = Date.now();
  const output = (executor as any).generateMockOutput(agent, input);
  const tokensUsed = Math.ceil((JSON.stringify(input).length + JSON.stringify(output).length) / 4);
  const duration = Date.now() - startTime;

  sendJSON(res, 200, {
    dryRun: true,
    agent: { id: agent.id, name: agent.name, type: agent.type, model: agent.model },
    input,
    output,
    estimatedTokens: tokensUsed,
    duration,
  });
}

async function handleListTemplates(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const templates = templateEngine.list();
  sendJSON(res, 200, { templates, count: templates.length });
}

async function handleAgentAnalytics(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = getUserId(req);
  const userAgents = Array.from(agents.values()).filter((a) => a.userId === userId);

  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let totalRuns = 0;
  let totalTokens = 0;
  let totalCost = 0;

  for (const agent of userAgents) {
    byType[agent.type] = (byType[agent.type] || 0) + 1;
    byStatus[agent.status] = (byStatus[agent.status] || 0) + 1;

    const agentRunsList = runs.get(agent.id) || [];
    totalRuns += agentRunsList.length;

    for (const run of agentRunsList) {
      totalTokens += run.tokensUsed;
      totalCost += run.cost;
    }
  }

  sendJSON(res, 200, {
    total: userAgents.length,
    byType,
    byStatus,
    totalRuns,
    totalTokens,
    totalCost: Math.round(totalCost * 10000) / 10000,
  });
}

function matchRoute(url: string, method: string): { handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>; params?: { [key: string]: string } } | null {
  const cleanUrl = url.split("?")[0] || "";
  const parts = cleanUrl.split("/").filter(Boolean);

  if (parts[0] === "health" && method === "GET") return { handler: handleHealth };
  if (parts[0] === "templates" && method === "GET") return { handler: handleListTemplates };

  if (parts[0] === "agents") {
    if (parts.length === 1 && method === "POST") return { handler: handleCreateAgent };
    if (parts.length === 1 && method === "GET") return { handler: handleListAgents };

    if (parts.length === 3 && parts[1] === "analytics" && parts[2] === "summary" && method === "GET") {
      return { handler: handleAgentAnalytics };
    }

    if (parts.length === 2 && parts[1] === "analytics") {
      return { handler: handleAgentAnalytics };
    }

    if (parts.length === 2 && method === "GET") return { handler: handleGetAgent };
    if (parts.length === 2 && method === "PUT") return { handler: handleUpdateAgent };
    if (parts.length === 2 && method === "DELETE") return { handler: handleDeleteAgent };

    if (parts.length === 3 && parts[2] === "run" && method === "POST") return { handler: handleRunAgent };
    if (parts.length === 3 && parts[2] === "runs" && method === "GET") return { handler: handleListRuns };
    if (parts.length === 3 && parts[2] === "pause" && method === "POST") return { handler: handlePauseAgent };
    if (parts.length === 3 && parts[2] === "resume" && method === "POST") return { handler: handleResumeAgent };
    if (parts.length === 3 && parts[2] === "test" && method === "POST") return { handler: handleTestAgent };

    if (parts.length === 5 && parts[2] === "runs" && parts[4] && method === "GET") {
      return { handler: handleGetRun };
    }
  }

  return null;
}

const server = createServer(async (req, res) => {
  cors(req, res, () => {
    if (req.method === "OPTIONS") return;

    if (req.url === "/health") {
      return sendJSON(res, 200, {
        status: "ok",
        service: "taskforge-agents",
        agents: agents.size,
        templates: templateEngine.list().length,
      });
    }

    auth(req, res, () => {
      rateLimit(req, res, async () => {
        try {
          const match = matchRoute(req.url || "", req.method || "GET");
          if (match) {
            return await match.handler(req, res);
          }
        } catch (err: any) {
          console.error(`[genesis:agents] Error on ${req.url}:`, err?.message);
          return sendJSON(res, 500, { error: err?.message || "Internal error" });
        }

        sendJSON(res, 404, { error: "Not found" });
      });
    });
  });
});

server.listen(PORT, () => {
  console.log(`[genesis:agents] Ready at http://localhost:${PORT}`);
  console.log(`[genesis:agents] Endpoints: /health, /agents, /templates, /agents/analytics/summary`);
});

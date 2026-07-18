import { createServer, IncomingMessage, ServerResponse } from "http";
import {
  createAuthMiddleware,
  createRateLimitMiddleware,
  createCorsMiddleware,
  sendJSON,
  readBody,
  getQueryParams,
} from "@taskforge/middleware";
import type { AuthenticatedRequest } from "@taskforge/middleware";

const PORT = parseInt(process.env.OPPORTUNITY_PORT || "3007");

interface Opportunity {
  id: string;
  userId: string;
  title: string;
  description: string;
  source: string;
  url: string | null;
  estimatedValue: number | null;
  confidence: number;
  score: number;
  status: "new" | "reviewing" | "pursuing" | "won" | "lost" | "archived";
  industry: string | null;
  location: string | null;
  deadline: string | null;
  notes: string | null;
  tags: string[];
  aiAnalysis: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

function generateId(): string {
  return `opp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

let isServerAvailable = false;
let dbClient: any = null;

try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { getServerClient } = require("@taskforge/database");
    dbClient = getServerClient();
    isServerAvailable = true;
  }
} catch {
  isServerAvailable = false;
}

const store = new Map<string, Opportunity>();

const HIGH_VALUE_KEYWORDS = [
  "enterprise", "saas", "ai", "machine learning", "cloud", "consulting",
  "digital transformation", "automation", "blockchain", "fintech",
];
const REPUTABLE_SOURCES: Record<string, number> = {
  linkedin: 85, upwork: 70, fiverr: 55, manual: 50, cold_outreach: 40,
};

class OpportunityEngine {
  score(opportunity: Partial<Opportunity>): { score: number; confidence: number; analysis: Record<string, unknown> } {
    let score = 50;
    const text = `${opportunity.title || ""} ${opportunity.description || ""}`.toLowerCase();
    let keywordHits = 0;
    for (const kw of HIGH_VALUE_KEYWORDS) {
      if (text.includes(kw)) { score += 5; keywordHits++; }
    }
    const sourceRep = REPUTABLE_SOURCES[opportunity.source || "manual"] || 50;
    score += (sourceRep - 50) * 0.2;
    if (opportunity.estimatedValue && opportunity.estimatedValue > 10000) score += 10;
    else if (opportunity.estimatedValue && opportunity.estimatedValue > 5000) score += 5;
    if (opportunity.deadline) {
      const daysLeft = (new Date(opportunity.deadline).getTime() - Date.now()) / 86400000;
      if (daysLeft > 14 && daysLeft < 60) score += 5;
      else if (daysLeft < 3) score -= 10;
    }
    score = Math.max(0, Math.min(100, Math.round(score)));
    const confidence = Math.min(1, 0.3 + keywordHits * 0.08 + (sourceRep / 100) * 0.3);
    const analysis = {
      keywordHits,
      sourceReputation: sourceRep,
      valueAssessment: opportunity.estimatedValue
        ? opportunity.estimatedValue > 10000 ? "high" : opportunity.estimatedValue > 5000 ? "medium" : "low"
        : "unknown",
      recommendation: score >= 70 ? "pursue" : score >= 50 ? "evaluate" : "monitor",
    };
    return { score, confidence: Math.round(confidence * 100) / 100, analysis };
  }

  search(query: string, _options?: { industry?: string; location?: string; budgetMin?: number; budgetMax?: number }): { opportunities: { title: string; description: string; source: string; estimatedValue: number; score: number; confidence: number; aiAnalysis: Record<string, unknown> }[]; summary: string } {
    const words = query.toLowerCase().split(/\s+/);
    const keywords = words.filter((w) => w.length > 3);
    const templates: { title: string; description: string; source: string; estimatedValue: number }[] = [
      { title: `Enterprise ${query} Implementation`, description: `Seeking experienced ${query} consultant for enterprise deployment.`, source: "linkedin", estimatedValue: 25000 },
      { title: `SaaS ${query} Integration Project`, description: `Mid-size company needs ${query} integration with existing stack.`, source: "linkedin", estimatedValue: 15000 },
      { title: `${query} Automation for SMB`, description: `Small business looking to automate workflows using ${query}.`, source: "linkedin", estimatedValue: 8000 },
    ];
    const generated: { title: string; description: string; source: string; estimatedValue: number; score: number; confidence: number; aiAnalysis: Record<string, unknown> }[] = [];
    for (const t of templates) {
      const { score, confidence, analysis } = this.score({ title: t.title, description: t.description, source: t.source, estimatedValue: t.estimatedValue });
      generated.push({ ...t, score, confidence, aiAnalysis: analysis });
    }
    const summary = `Found ${generated.length} opportunities matching "${query}". Keywords matched: ${keywords.join(", ") || "general"}. Top score: ${generated[0]?.score || 0}.`;
    return { opportunities: generated, summary };
  }
}

const engine = new OpportunityEngine();

async function persistOpportunity(opp: Opportunity): Promise<void> {
  if (!isServerAvailable || !dbClient) return;
  try {
    await dbClient.from("opportunities").upsert({
      id: opp.id, user_id: opp.userId, title: opp.title, description: opp.description,
      source: opp.source, url: opp.url, estimated_value: opp.estimatedValue,
      confidence: opp.confidence, score: opp.score, status: opp.status,
      industry: opp.industry, location: opp.location, deadline: opp.deadline,
      notes: opp.notes, tags: opp.tags, ai_analysis: opp.aiAnalysis,
    }, { onConflict: "id" });
  } catch (err: any) {
    console.error(`[opportunity] DB persist failed: ${err?.message}`);
  }
}

function toResponse(opp: Opportunity) {
  return {
    id: opp.id, userId: opp.userId, title: opp.title, description: opp.description,
    source: opp.source, url: opp.url, estimatedValue: opp.estimatedValue,
    confidence: opp.confidence, score: opp.score, status: opp.status,
    industry: opp.industry, location: opp.location, deadline: opp.deadline,
    notes: opp.notes, tags: opp.tags, aiAnalysis: opp.aiAnalysis,
    createdAt: opp.createdAt, updatedAt: opp.updatedAt,
  };
}

async function handleSearch(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.query) return sendJSON(res, 400, { error: "Missing required field: query" });
  const { opportunities, summary } = engine.search(body.query, {
    industry: body.industry, location: body.location,
    budgetMin: body.budgetMin, budgetMax: body.budgetMax,
  });
  const user = (req as AuthenticatedRequest).user;
  const userId = user?.sub || "anonymous";
  const results: Opportunity[] = opportunities.map((o) => ({
    id: generateId(), userId, title: o.title || "", description: o.description || "",
    source: o.source || "ai_search", url: null, estimatedValue: o.estimatedValue || null,
    confidence: o.confidence || 0, score: o.score || 0, status: "new" as const,
    industry: body.industry || null, location: body.location || null,
    deadline: null, notes: null, tags: [], aiAnalysis: o.aiAnalysis || null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }));
  for (const r of results) { store.set(r.id, r); persistOpportunity(r); }
  sendJSON(res, 200, { opportunities: results.map(toResponse), count: results.length, aiSummary: summary });
}

async function handleList(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const params = getQueryParams(req);
  const user = (req as AuthenticatedRequest).user;
  const userId = user?.sub;
  let items = Array.from(store.values());
  if (userId) items = items.filter((o) => o.userId === userId);
  const status = params.get("status");
  if (status) items = items.filter((o) => o.status === status);
  const scoreMin = params.get("scoreMin");
  if (scoreMin) items = items.filter((o) => o.score >= parseInt(scoreMin));
  const limit = parseInt(params.get("limit") || "50");
  const offset = parseInt(params.get("offset") || "0");
  const total = items.length;
  const paginated = items.slice(offset, offset + limit);
  sendJSON(res, 200, { opportunities: paginated.map(toResponse), total, limit, offset });
}

async function handleCreate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.title) return sendJSON(res, 400, { error: "Missing required field: title" });
  const user = (req as AuthenticatedRequest).user;
  const userId = user?.sub || "anonymous";
  const engineResult = engine.score({
    title: body.title, description: body.description || "",
    source: body.source || "manual", estimatedValue: body.estimatedValue,
    deadline: body.deadline,
  });
  const opp: Opportunity = {
    id: generateId(), userId, title: body.title, description: body.description || "",
    source: body.source || "manual", url: body.url || null,
    estimatedValue: body.estimatedValue || null, confidence: engineResult.confidence,
    score: engineResult.score, status: "new",
    industry: body.industry || null, location: body.location || null,
    deadline: body.deadline || null, notes: body.notes || null,
    tags: body.tags || [], aiAnalysis: engineResult.analysis,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  store.set(opp.id, opp);
  persistOpportunity(opp);
  sendJSON(res, 201, toResponse(opp));
}

async function handleGetById(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const id = req.url?.split("/opportunities/")[1]?.split("?")[0];
  if (!id) return sendJSON(res, 400, { error: "Missing opportunity id" });
  const opp = store.get(id);
  if (!opp) return sendJSON(res, 404, { error: "Opportunity not found" });
  sendJSON(res, 200, toResponse(opp));
}

async function handleUpdate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const id = req.url?.split("/opportunities/")[1]?.split("?")[0];
  if (!id) return sendJSON(res, 400, { error: "Missing opportunity id" });
  const opp = store.get(id);
  if (!opp) return sendJSON(res, 404, { error: "Opportunity not found" });
  const body = JSON.parse(await readBody(req));
  const updated: Opportunity = {
    ...opp, ...body, id: opp.id, userId: opp.userId,
    updatedAt: new Date().toISOString(),
  };
  if (body.title || body.description || body.source || body.estimatedValue || body.deadline) {
    const engineResult = engine.score({
      title: updated.title, description: updated.description,
      source: updated.source, estimatedValue: updated.estimatedValue,
      deadline: updated.deadline,
    });
    updated.confidence = engineResult.confidence;
    updated.score = engineResult.score;
    updated.aiAnalysis = engineResult.analysis;
  }
  store.set(id, updated);
  persistOpportunity(updated);
  sendJSON(res, 200, toResponse(updated));
}

async function handleDelete(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const id = req.url?.split("/opportunities/")[1]?.split("?")[0];
  if (!id) return sendJSON(res, 400, { error: "Missing opportunity id" });
  if (!store.has(id)) return sendJSON(res, 404, { error: "Opportunity not found" });
  store.delete(id);
  if (isServerAvailable && dbClient) {
    try { await dbClient.from("opportunities").delete().eq("id", id); } catch { /* ignore */ }
  }
  sendJSON(res, 200, { deleted: true, id });
}

async function handleScore(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const path = req.url?.split("?")[0] || "";
  const segments = path.split("/").filter(Boolean);
  const id = segments[1];
  if (!id) return sendJSON(res, 400, { error: "Missing opportunity id" });
  const opp = store.get(id);
  if (!opp) return sendJSON(res, 404, { error: "Opportunity not found" });
  const engineResult = engine.score({
    title: opp.title, description: opp.description,
    source: opp.source, estimatedValue: opp.estimatedValue,
    deadline: opp.deadline,
  });
  opp.confidence = engineResult.confidence;
  opp.score = engineResult.score;
  opp.aiAnalysis = engineResult.analysis;
  opp.updatedAt = new Date().toISOString();
  store.set(id, opp);
  persistOpportunity(opp);
  sendJSON(res, 200, {
    id: opp.id, confidence: opp.confidence, score: opp.score, aiAnalysis: opp.aiAnalysis,
  });
}

async function handleAnalytics(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const all = Array.from(store.values());
  const byStatus: Record<string, number> = {};
  let totalConfidence = 0;
  let totalValue = 0;
  const sourceCounts: Record<string, number> = {};
  for (const o of all) {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    totalConfidence += o.confidence;
    totalValue += o.estimatedValue || 0;
    sourceCounts[o.source] = (sourceCounts[o.source] || 0) + 1;
  }
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));
  sendJSON(res, 200, {
    total: all.length,
    byStatus,
    avgConfidence: all.length ? Math.round((totalConfidence / all.length) * 100) / 100 : 0,
    totalValue,
    topSources,
  });
}

async function handleImport(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.source || !body.items || !Array.isArray(body.items)) {
    return sendJSON(res, 400, { error: "Missing required fields: source, items (array)" });
  }
  const user = (req as AuthenticatedRequest).user;
  const userId = user?.sub || "anonymous";
  const existingTitles = new Set(Array.from(store.values()).map((o) => o.title.toLowerCase()));
  const imported: Opportunity[] = [];
  const skipped: number[] = [];
  for (let i = 0; i < body.items.length; i++) {
    const item = body.items[i];
    const dedupKey = (item.title || "").toLowerCase();
    if (existingTitles.has(dedupKey)) { skipped.push(i); continue; }
    existingTitles.add(dedupKey);
    const engineResult = engine.score({
      title: item.title, description: item.description,
      source: body.source, estimatedValue: item.estimatedValue,
      deadline: item.deadline,
    });
    const opp: Opportunity = {
      id: generateId(), userId, title: item.title || "Untitled",
      description: item.description || "", source: body.source,
      url: item.url || null, estimatedValue: item.estimatedValue || null,
      confidence: engineResult.confidence, score: engineResult.score,
      status: "new", industry: item.industry || null,
      location: item.location || null, deadline: item.deadline || null,
      notes: item.notes || null, tags: item.tags || [],
      aiAnalysis: engineResult.analysis,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    store.set(opp.id, opp);
    persistOpportunity(opp);
    imported.push(opp);
  }
  sendJSON(res, 200, { imported: imported.length, skipped: skipped.length, opportunities: imported.map(toResponse) });
}

const auth = createAuthMiddleware({ publicRoutes: ["/health"] });
const rateLimit = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 30 });
const cors = createCorsMiddleware();

const fixedRoutes: Record<string, Record<string, (req: IncomingMessage, res: ServerResponse) => Promise<void>>> = {
  "/opportunities/search": { POST: handleSearch },
  "/opportunities/analytics/summary": { GET: handleAnalytics },
  "/opportunities/import": { POST: handleImport },
  "/opportunities": { GET: handleList, POST: handleCreate },
};

const server = createServer(async (req, res) => {
  cors(req, res, () => {
    if (req.method === "OPTIONS") return;
    if (req.url === "/health") {
      return sendJSON(res, 200, { status: "ok", service: "genesis-opportunity", dbConnected: isServerAvailable });
    }
    auth(req, res, () => {
      rateLimit(req, res, async () => {
        try {
          const path = req.url?.split("?")[0] || "";
          const method = req.method || "";
          const fixedHandler = fixedRoutes[path]?.[method];
          if (fixedHandler) return await fixedHandler(req, res);
          if (path.startsWith("/opportunities/")) {
            const remainder = path.slice("/opportunities/".length);
            if (remainder === "score") {
              return await handleScore(req, res);
            }
            if (remainder.includes("/score") && req.method === "POST") {
              return await handleScore(req, res);
            }
            if (method === "GET") return await handleGetById(req, res);
            if (method === "PUT") return await handleUpdate(req, res);
            if (method === "DELETE") return await handleDelete(req, res);
          }
        } catch (err: any) {
          console.error(`[opportunity] Error on ${req.url}:`, err?.message);
          return sendJSON(res, 500, { error: err?.message || "Internal error" });
        }
        sendJSON(res, 404, { error: "Not found" });
      });
    });
  });
});

server.listen(PORT, () => {
  console.log(`[genesis:opportunity] Ready at http://localhost:${PORT} (db: ${isServerAvailable ? "connected" : "in-memory"})`);
  console.log(`[genesis:opportunity] Endpoints: /opportunities, /opportunities/search, /opportunities/analytics/summary, /opportunities/import`);
});

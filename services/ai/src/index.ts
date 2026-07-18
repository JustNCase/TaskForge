import { createServer, IncomingMessage, ServerResponse } from "http";
import { AIOrchestrator, NLPEngine, SentimentAnalyzer, PredictionEngine, EmbeddingService, TFModelManager } from "@taskforge/ai";
import {
  createAuthMiddleware,
  createRateLimitMiddleware,
  createCorsMiddleware,
  sendJSON,
  readBody,
  compose,
} from "@taskforge/middleware";
import type { AuthenticatedRequest } from "@taskforge/middleware";

const PORT = parseInt(process.env.AI_PORT || "3003");
const MODEL = process.env.AI_MODEL || "gpt-4o-mini";

const orchestrator = new AIOrchestrator(process.env.OPENAI_API_KEY, MODEL);
const nlp = new NLPEngine(process.env.OPENAI_API_KEY, MODEL);
const sentiment = new SentimentAnalyzer(process.env.OPENAI_API_KEY, MODEL);
const prediction = new PredictionEngine(process.env.OPENAI_API_KEY, MODEL);
const embedding = new EmbeddingService(process.env.OPENAI_API_KEY);
const tfManager = new TFModelManager();

const auth = createAuthMiddleware({ publicRoutes: ["/health"] });
const rateLimit = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 60 });
const cors = createCorsMiddleware();

async function handleChat(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  const response = await orchestrator.chat(body.messages || [{ role: "user", content: body.message }], {
    temperature: body.temperature,
    maxTokens: body.maxTokens,
  });
  sendJSON(res, 200, { response, model: MODEL });
}

async function handleChatContext(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.sessionId || !body.message) {
    return sendJSON(res, 400, { error: "Missing required fields: sessionId, message" });
  }
  const result = await orchestrator.chatWithContext(body.sessionId, body.message, body.systemPrompt);
  sendJSON(res, 200, {
    response: result.response,
    sessionId: result.context.sessionId,
    messageCount: result.context.messages.length,
    model: MODEL,
  });
}

async function handleSummarize(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.sessionId) return sendJSON(res, 400, { error: "Missing required field: sessionId" });
  const summary = await orchestrator.summarizeConversation(body.sessionId);
  sendJSON(res, 200, { sessionId: body.sessionId, summary, model: MODEL });
}

async function handleMultimodal(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.image && !body.text) {
    return sendJSON(res, 400, { error: "At least one of image (base64) or text is required" });
  }
  const result = await orchestrator.processMultimodal(
    { imageBase64: body.image, text: body.text },
    body.systemPrompt
  );
  sendJSON(res, 200, { ...result, model: MODEL });
}

async function handleAnalyze(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  const result = await orchestrator.analyze(body.text || body.message || "");
  sendJSON(res, 200, { analysis: result, model: MODEL });
}

async function handleNLP(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.text) return sendJSON(res, 400, { error: "Missing required field: text" });
  const result = await nlp.parse(body.text);
  sendJSON(res, 200, { ...result, model: MODEL });
}

async function handleSentiment(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.text) return sendJSON(res, 400, { error: "Missing required field: text" });
  const result = await sentiment.analyze(body.text);
  sendJSON(res, 200, { sentiment: result, model: MODEL });
}

async function handlePredict(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.data) return sendJSON(res, 400, { error: "Missing required field: data" });
  const result = await prediction.predict(body.data, body.horizon || 7, body.metadata);
  sendJSON(res, 200, { ...result, model: MODEL });
}

async function handleEmbed(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.text) return sendJSON(res, 400, { error: "Missing required field: text" });
  const result = await embedding.embed(body.text);
  sendJSON(res, 200, { ...result, model: result.model });
}

async function handleEmbedBatch(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.texts || !Array.isArray(body.texts)) {
    return sendJSON(res, 400, { error: "Missing required field: texts (array)" });
  }
  const results = await embedding.embedBatch(body.texts);
  sendJSON(res, 200, { embeddings: results, count: results.length, model: results[0]?.model || "" });
}

async function handleSemanticSearch(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.query || !body.texts) {
    return sendJSON(res, 400, { error: "Missing required fields: query, texts" });
  }
  const results = await embedding.semanticSearch(body.query, body.texts, body.topK || 5);
  sendJSON(res, 200, { results, count: results.length });
}

async function handleTFModels(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (tfManager.isAvailable()) {
    const models = await tfManager.listModels();
    sendJSON(res, 200, { available: true, models });
  } else {
    sendJSON(res, 200, { available: false, message: "TensorFlow.js not installed" });
  }
}

const routes: Record<string, Record<string, (req: IncomingMessage, res: ServerResponse) => Promise<void>>> = {
  "/chat": { POST: handleChat },
  "/chat/context": { POST: handleChatContext },
  "/chat/summarize": { POST: handleSummarize },
  "/multimodal": { POST: handleMultimodal },
  "/analyze": { POST: handleAnalyze },
  "/nlp": { POST: handleNLP },
  "/sentiment": { POST: handleSentiment },
  "/predict": { POST: handlePredict },
  "/embed": { POST: handleEmbed },
  "/embed/batch": { POST: handleEmbedBatch },
  "/embed/search": { POST: handleSemanticSearch },
  "/models/tf": { GET: handleTFModels },
};

const server = createServer(async (req, res) => {
  cors(req, res, () => {
    if (req.method === "OPTIONS") return;

    if (req.url === "/health") {
      return sendJSON(res, 200, { status: "ok", service: "genesis-ai", model: MODEL });
    }

    auth(req, res, () => {
      rateLimit(req, res, async () => {
        try {
          const path = req.url?.split("?")[0] || "";
          const handler = routes[path]?.[req.method || ""];
          if (handler) return await handler(req, res);
        } catch (err: any) {
          console.error(`[genesis:ai] Error on ${req.url}:`, err?.message);
          return sendJSON(res, 500, { error: err?.message || "Internal error" });
        }

        sendJSON(res, 404, { error: "Not found" });
      });
    });
  });
});

server.listen(PORT, () => {
  console.log(`[genesis:ai] Ready at http://localhost:${PORT} (model: ${MODEL})`);
  console.log(`[genesis:ai] Endpoints: /chat, /chat/context, /chat/summarize, /multimodal, /analyze, /nlp, /sentiment, /predict, /embed, /embed/batch, /embed/search, /models/tf`);
});

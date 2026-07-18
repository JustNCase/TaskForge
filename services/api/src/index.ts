import { createConfig } from "@taskforge/core";
import { createServer } from "http";
import { handleAuth } from "./routes/auth";
import { handleDashboard } from "./routes/dashboard";
import { handleVoice } from "./routes/voice";
import { handleAI } from "./routes/ai";
import { handleVision } from "./routes/vision";
import { handleIntegration } from "./routes/integration";
import { handleEvents } from "./routes/events";
import { handleNotifications } from "./routes/notifications";
import { ServiceMonitor } from "./middleware/monitor";
import { initDatabase } from "./db";

const config = createConfig({
  env: (process.env.NODE_ENV as "development" | "production") || "development",
  port: parseInt(process.env.API_PORT || "3001"),
  logLevel: "info",
  cors: { origin: "*" },
});

const apiMonitor = new ServiceMonitor("genesis-api");

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const startTime = Date.now();

  const sendRoot = () => {
    res.writeHead(200);
    res.end(JSON.stringify({ service: "genesis-api", version: "0.1.0", status: "ok" }));
    const duration = Date.now() - startTime;
    apiMonitor.recordLatency(duration);
  };

  try {
    if (url.pathname.startsWith("/api/auth")) {
      return await handleAuth(req, res, url);
    }
    if (url.pathname.startsWith("/api/dashboard")) {
      return await handleDashboard(req, res, url);
    }
    if (url.pathname.startsWith("/api/voice")) {
      return await handleVoice(req, res, url);
    }
    if (url.pathname.startsWith("/api/ai")) {
      return await handleAI(req, res, url);
    }
    if (url.pathname.startsWith("/api/vision")) {
      return await handleVision(req, res, url);
    }
    if (url.pathname.startsWith("/api/integration")) {
      return await handleIntegration(req, res, url);
    }
    if (url.pathname.startsWith("/api/events")) {
      return await handleEvents(req, res, url);
    }
    if (url.pathname.startsWith("/api/notifications")) {
      return await handleNotifications(req, res, url);
    }

    sendRoot();
  } catch (err: any) {
    const duration = Date.now() - startTime;
    apiMonitor.recordLatency(duration);
    apiMonitor.error(err, err?.message || "Internal server error");
    console.error(`[genesis:api] Error:`, err);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(500);
    res.end(JSON.stringify({ error: err?.message || "Internal server error" }));
  }
});

async function start() {
  console.log(`[genesis:api] Starting on port ${config.port} (${config.env})`);
  await initDatabase();

  server.listen(config.port, () => {
    console.log(`[genesis:api] Ready at http://localhost:${config.port}`);
    console.log(`[genesis:api] Health check available at http://localhost:${config.port}/health`);
  });

  apiMonitor.info("API service started");
}

start().catch((err) => {
  console.error("[genesis:api] Failed to start:", err);
  process.exit(1);
});

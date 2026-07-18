import { createServer } from "http";

const PORT = parseInt(process.env.ANALYTICS_PORT || "3004");

const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.url === "/health") {
    res.writeHead(200);
    return res.end(JSON.stringify({ status: "ok", service: "genesis-analytics" }));
  }

  if (req.url === "/metrics") {
    res.writeHead(200);
    return res.end(JSON.stringify({
      metrics: {
        voiceCommandsTotal: 1204,
        aiRequestsTotal: 892,
        avgResponseTime: 245,
        errorRate: 0.02,
      },
      period: "24h",
      timestamp: new Date().toISOString(),
    }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`[genesis:analytics] Ready at http://localhost:${PORT}`);
});

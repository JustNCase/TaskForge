import type { IncomingMessage, ServerResponse } from "http";

export function handleDashboard(req: IncomingMessage, res: ServerResponse, url: URL): void {
  const path = url.pathname.replace("/api/dashboard", "");

  if (path === "/metrics" || path === "") {
    const metrics = {
      totalUsers: 142,
      activeSessions: 38,
      voiceCommands: 1204,
      aiRequests: 892,
      uptime: "99.7%",
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      // Add analytics metrics
      system: {
        nodeVersion: process.version || "N/A",
        platform: process.platform || "N/A",
        arch: process.arch || "N/A",
        pid: process.pid || process.pid,
        ctime: process.uptime(),
      },
      services: {
        api: "ready",
        voice: "ready", 
        ai: "ready",
        analytics: "ready",
        web: "ready",
      },
      performance: {
        requestsPerSecond: 145,
        averageResponseTime: 245,
        errorRate: 0.02,
        cacheHitRate: 0.87,
      },
    };
    
    res.writeHead(200);
    res.end(JSON.stringify({ metrics }));
    return;
  }

  if (path === "/activity") {
    const activities = [
      { id: "1", type: "voice", message: "Voice command: 'Show analytics'", time: "2m ago" },
      { id: "2", type: "ai", message: "AI insight generated for analytics", time: "5m ago" },
      { id: "3", type: "system", message: "System health check passed", time: "10m ago" },
      { id: "4", type: "user", message: "User logged in to dashboard", time: "15m ago" },
      { id: "5", type: "voice", message: "Voice command: 'Navigate to dashboard'", time: "20m ago" },
      { id: "6", type: "ai", message: "AI generated predictions for metrics", time: "25m ago" },
    ];
    
    res.writeHead(200);
    res.end(JSON.stringify({ activities }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Dashboard endpoint not found" }));
}

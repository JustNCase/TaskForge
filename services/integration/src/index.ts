import { createServer, IncomingMessage, ServerResponse } from "http";
import { GitHubConnector, SlackConnector, CalendarConnector, JiraConnector } from "@taskforge/integration";
import {
  createAuthMiddleware,
  createRateLimitMiddleware,
  createCorsMiddleware,
  sendJSON,
  readBody,
} from "@taskforge/middleware";

const PORT = parseInt(process.env.INTEGRATION_PORT || "3006");

const auth = createAuthMiddleware({ publicRoutes: ["/health"] });
const rateLimit = createRateLimitMiddleware({ windowMs: 60000, maxRequests: 40 });
const cors = createCorsMiddleware();

function getConnectorConfig(body: any): { token?: string; owner?: string; repo?: string; webhookUrl?: string; channel?: string; baseUrl?: string; email?: string } {
  return {
    token: body.token || process.env.GITHUB_TOKEN || process.env.INTEGRATION_TOKEN,
    owner: body.owner || process.env.GITHUB_OWNER,
    repo: body.repo || process.env.GITHUB_REPO,
    webhookUrl: body.webhookUrl || process.env.SLACK_WEBHOOK_URL,
    channel: body.channel || process.env.SLACK_CHANNEL,
    baseUrl: body.baseUrl || process.env.JIRA_BASE_URL,
    email: body.email || process.env.JIRA_EMAIL,
  };
}

async function handleGithubIssues(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  const cfg = getConnectorConfig(body);
  if (!cfg.token || !cfg.owner || !cfg.repo) {
    return sendJSON(res, 400, { error: "Missing required config: token, owner, repo" });
  }
  const github = new GitHubConnector({ token: cfg.token, owner: cfg.owner!, repo: cfg.repo! });
  const issues = await github.getIssues(body.state);
  sendJSON(res, 200, { issues, count: issues.length });
}

async function handleGithubCreateIssue(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  const cfg = getConnectorConfig(body);
  if (!cfg.token || !cfg.owner || !cfg.repo) {
    return sendJSON(res, 400, { error: "Missing required config: token, owner, repo" });
  }
  if (!body.title) return sendJSON(res, 400, { error: "Missing required field: title" });
  const github = new GitHubConnector({ token: cfg.token, owner: cfg.owner!, repo: cfg.repo! });
  const issue = await github.createIssue(body.title, body.body || "", body.labels);
  sendJSON(res, 201, { issue });
}

async function handleGithubPRs(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  const cfg = getConnectorConfig(body);
  if (!cfg.token || !cfg.owner || !cfg.repo) {
    return sendJSON(res, 400, { error: "Missing required config: token, owner, repo" });
  }
  const github = new GitHubConnector({ token: cfg.token, owner: cfg.owner!, repo: cfg.repo! });
  const prs = await github.getPRs(body.state);
  sendJSON(res, 200, { pullRequests: prs, count: prs.length });
}

async function handleGithubRepo(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  const cfg = getConnectorConfig(body);
  if (!cfg.token || !cfg.owner || !cfg.repo) {
    return sendJSON(res, 400, { error: "Missing required config: token, owner, repo" });
  }
  const github = new GitHubConnector({ token: cfg.token, owner: cfg.owner!, repo: cfg.repo! });
  const repo = await github.getRepo();
  sendJSON(res, 200, { repo });
}

async function handleSlackSend(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  const cfg = getConnectorConfig(body);
  if (!body.text) return sendJSON(res, 400, { error: "Missing required field: text" });
  const slack = new SlackConnector({ webhookUrl: cfg.webhookUrl, token: cfg.token, channel: cfg.channel });
  const result = await slack.sendMessage(body.text, body.channel);
  sendJSON(res, 200, { ok: result.ok, ts: result.ts });
}

async function handleSlackHistory(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  const cfg = getConnectorConfig(body);
  if (!cfg.token) return sendJSON(res, 400, { error: "Slack token required" });
  if (!body.channel) return sendJSON(res, 400, { error: "Missing required field: channel" });
  const slack = new SlackConnector({ token: cfg.token });
  const messages = await slack.getChannelHistory(body.channel, body.limit);
  sendJSON(res, 200, { messages, count: messages.length });
}

async function handleCalendarEvents(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.accessToken) return sendJSON(res, 400, { error: "Missing required field: accessToken" });
  if (!body.start || !body.end) return sendJSON(res, 400, { error: "Missing required fields: start, end" });
  const cal = new CalendarConnector({
    provider: body.provider || "google",
    accessToken: body.accessToken,
    calendarId: body.calendarId,
  });
  const events = await cal.getEvents(body.start, body.end);
  sendJSON(res, 200, { events, count: events.length });
}

async function handleCalendarCreate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  if (!body.accessToken) return sendJSON(res, 400, { error: "Missing required field: accessToken" });
  if (!body.title || !body.start || !body.end) {
    return sendJSON(res, 400, { error: "Missing required fields: title, start, end" });
  }
  const cal = new CalendarConnector({
    provider: body.provider || "google",
    accessToken: body.accessToken,
    calendarId: body.calendarId,
  });
  const event = await cal.createEvent({
    title: body.title, description: body.description,
    start: body.start, end: body.end,
    attendees: body.attendees, location: body.location,
  });
  sendJSON(res, 201, { event });
}

async function handleJiraSearch(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req));
  const cfg = getConnectorConfig(body);
  if (!cfg.baseUrl || !cfg.email || !cfg.token) {
    return sendJSON(res, 400, { error: "Missing required config: baseUrl, email, apiToken" });
  }
  if (!body.jql) return sendJSON(res, 400, { error: "Missing required field: jql" });
  const jira = new JiraConnector({ baseUrl: cfg.baseUrl, email: cfg.email!, apiToken: cfg.token! });
  const issues = await jira.searchIssues(body.jql, body.maxResults);
  sendJSON(res, 200, { issues, count: issues.length });
}

const routes: Record<string, Record<string, (req: IncomingMessage, res: ServerResponse) => Promise<void>>> = {
  "/github/issues": { POST: handleGithubIssues },
  "/github/issues/create": { POST: handleGithubCreateIssue },
  "/github/pulls": { POST: handleGithubPRs },
  "/github/repo": { POST: handleGithubRepo },
  "/slack/send": { POST: handleSlackSend },
  "/slack/history": { POST: handleSlackHistory },
  "/calendar/events": { POST: handleCalendarEvents },
  "/calendar/events/create": { POST: handleCalendarCreate },
  "/jira/search": { POST: handleJiraSearch },
};

const server = createServer(async (req, res) => {
  cors(req, res, () => {
    if (req.method === "OPTIONS") return;

    if (req.url === "/health") {
      return sendJSON(res, 200, { status: "ok", service: "genesis-integration" });
    }

    auth(req, res, () => {
      rateLimit(req, res, async () => {
        try {
          const path = req.url?.split("?")[0] || "";
          const handler = routes[path]?.[req.method || ""];
          if (handler) return await handler(req, res);
        } catch (err: any) {
          console.error(`[genesis:integration] Error on ${req.url}:`, err?.message);
          return sendJSON(res, 502, { error: err?.message || "Integration error" });
        }

        sendJSON(res, 404, { error: "Not found" });
      });
    });
  });
});

server.listen(PORT, () => {
  console.log(`[genesis:integration] Ready at http://localhost:${PORT}`);
  console.log(`[genesis:integration] Endpoints: POST /github/*, /slack/*, /calendar/*, /jira/*`);
});

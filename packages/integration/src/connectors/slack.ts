export interface SlackConfig {
  webhookUrl?: string;
  token?: string;
  channel?: string;
}

export interface SlackMessage {
  ok: boolean;
  ts?: string;
  channel?: string;
  error?: string;
}

const SLACK_API = "https://slack.com/api";

export class SlackConnector {
  private config: SlackConfig;

  constructor(config: SlackConfig) {
    this.config = config;
  }

  private async postWebhook(text: string): Promise<void> {
    if (!this.config.webhookUrl) throw new Error("Slack webhook URL not configured");
    const res = await fetch(this.config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`Slack webhook error: ${res.status}`);
  }

  private async postApi(method: string, body: Record<string, unknown>): Promise<any> {
    if (!this.config.token) throw new Error("Slack token not configured");
    const res = await fetch(`${SLACK_API}/${method}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
    return data;
  }

  async sendMessage(text: string, channel?: string): Promise<SlackMessage> {
    const target = channel || this.config.channel;
    if (target) {
      return this.postApi("chat.postMessage", { channel: target, text });
    }
    await this.postWebhook(text);
    return { ok: true };
  }

  async sendBlocks(blocks: unknown[], channel?: string): Promise<SlackMessage> {
    const target = channel || this.config.channel;
    if (!target) throw new Error("Channel required for blocks");
    return this.postApi("chat.postMessage", { channel: target, blocks });
  }

  async getUserInfo(userId: string): Promise<{ id: string; name: string; email: string }> {
    const data = await this.postApi("users.info", { user: userId });
    const u = data.user;
    return { id: u.id, name: u.real_name || u.name, email: u.profile?.email || "" };
  }

  async getChannelHistory(channel: string, limit = 50): Promise<any[]> {
    const data = await this.postApi("conversations.history", { channel, limit });
    return data.messages || [];
  }
}

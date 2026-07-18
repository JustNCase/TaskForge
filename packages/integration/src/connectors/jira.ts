export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  status: string;
  assignee: string | null;
  priority: string;
  issueType: string;
  createdAt: string;
  updatedAt: string;
  url: string;
}

export class JiraConnector {
  private config: JiraConfig;
  private auth: string;

  constructor(config: JiraConfig) {
    this.config = config;
    this.auth = Buffer.from(`${config.email}:${config.apiToken}`).toString("base64");
  }

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const res = await fetch(`${this.config.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Basic ${this.auth}`,
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      },
    });
    if (!res.ok) throw new Error(`Jira API error: ${res.status} ${res.statusText}`);
    return res.json();
  }

  async searchIssues(jql: string, maxResults = 50): Promise<JiraIssue[]> {
    const data = await this.request(
      `/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`
    );
    return (data.issues || []).map((i: any) => ({
      id: i.id,
      key: i.key,
      summary: i.fields.summary,
      status: i.fields.status?.name || "",
      assignee: i.fields.assignee?.displayName || null,
      priority: i.fields.priority?.name || "None",
      issueType: i.fields.issuetype?.name || "",
      createdAt: i.fields.created,
      updatedAt: i.fields.updated,
      url: `${this.config.baseUrl}/browse/${i.key}`,
    }));
  }

  async getIssue(key: string): Promise<JiraIssue> {
    const i = await this.request(`/rest/api/3/issue/${key}`);
    return {
      id: i.id, key: i.key, summary: i.fields.summary,
      status: i.fields.status?.name || "", assignee: i.fields.assignee?.displayName || null,
      priority: i.fields.priority?.name || "None", issueType: i.fields.issuetype?.name || "",
      createdAt: i.fields.created, updatedAt: i.fields.updated,
      url: `${this.config.baseUrl}/browse/${i.key}`,
    };
  }
}

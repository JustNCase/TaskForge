export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: "open" | "closed";
  body: string;
  labels: string[];
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
  url: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  state: "open" | "closed" | "merged";
  body: string;
  head: string;
  base: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  additions: number;
  deletions: number;
  url: string;
}

export interface GitHubRepo {
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  defaultBranch: string;
}

const GITHUB_API = "https://api.github.com";

export class GitHubConnector {
  private config: GitHubConfig;
  private headers: Record<string, string>;

  constructor(config: GitHubConfig) {
    this.config = config;
    this.headers = {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "genesis-os",
    };
  }

  async getIssues(state?: "open" | "closed" | "all"): Promise<GitHubIssue[]> {
    const params = state ? `?state=${state}` : "";
    const res = await fetch(
      `${GITHUB_API}/repos/${this.config.owner}/${this.config.repo}/issues${params}`,
      { headers: this.headers }
    );
    if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    const data: any[] = await res.json();
    return data
      .filter((i: any) => !i.pull_request)
      .map((i: any) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        body: i.body || "",
        labels: i.labels?.map((l: any) => l.name) || [],
        assignee: i.assignee?.login || null,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
        url: i.html_url,
      }));
  }

  async createIssue(title: string, body: string, labels?: string[]): Promise<GitHubIssue> {
    const res = await fetch(
      `${GITHUB_API}/repos/${this.config.owner}/${this.config.repo}/issues`,
      {
        method: "POST",
        headers: { ...this.headers, "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, labels }),
      }
    );
    if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    const i = await res.json();
    return {
      number: i.number, title: i.title, state: i.state, body: i.body || "",
      labels: i.labels?.map((l: any) => l.name) || [], assignee: i.assignee?.login || null,
      createdAt: i.created_at, updatedAt: i.updated_at, url: i.html_url,
    };
  }

  async getPRs(state?: "open" | "closed" | "all"): Promise<GitHubPR[]> {
    const params = state ? `?state=${state}` : "";
    const res = await fetch(
      `${GITHUB_API}/repos/${this.config.owner}/${this.config.repo}/pulls${params}`,
      { headers: this.headers }
    );
    if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    const data: any[] = await res.json();
    return data.map((pr: any) => ({
      number: pr.number,
      title: pr.title,
      state: pr.merged ? "merged" : pr.state,
      body: pr.body || "",
      head: pr.head?.ref || "",
      base: pr.base?.ref || "",
      author: pr.user?.login || "",
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      additions: pr.additions || 0,
      deletions: pr.deletions || 0,
      url: pr.html_url,
    }));
  }

  async getRepo(): Promise<GitHubRepo> {
    const res = await fetch(
      `${GITHUB_API}/repos/${this.config.owner}/${this.config.repo}`,
      { headers: this.headers }
    );
    if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    const r = await res.json();
    return {
      name: r.name, fullName: r.full_name, description: r.description || "",
      stars: r.stargazers_count, forks: r.forks_count,
      openIssues: r.open_issues_count, language: r.language || "",
      defaultBranch: r.default_branch,
    };
  }
}

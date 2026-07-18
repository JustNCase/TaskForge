import { randomBytes } from "crypto";

export interface Session {
  id: string;
  userId: string;
  email: string;
  role: string;
  ip?: string;
  userAgent?: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
}

export interface SessionOptions {
  ttlMs?: number;
  maxSessionsPerUser?: number;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private userSessionIds: Map<string, Set<string>> = new Map();
  private ttlMs: number;
  private maxSessionsPerUser: number;

  constructor(options?: SessionOptions) {
    this.ttlMs = options?.ttlMs || 86400000;
    this.maxSessionsPerUser = options?.maxSessionsPerUser || 10;
  }

  async create(userId: string, email: string, role: string, metadata?: { ip?: string; userAgent?: string }): Promise<Session> {
    this.cleanup();

    const userSessions = this.userSessionIds.get(userId);
    if (userSessions && userSessions.size >= this.maxSessionsPerUser) {
      const oldest = Array.from(userSessions)
        .map((id) => this.sessions.get(id)!)
        .sort((a, b) => a.createdAt - b.createdAt);
      for (let i = 0; i <= oldest.length - this.maxSessionsPerUser; i++) {
        this.destroy(oldest[i].id);
      }
    }

    const now = Date.now();
    const session: Session = {
      id: `sess_${randomBytes(16).toString("hex")}`,
      userId,
      email,
      role,
      ip: metadata?.ip,
      userAgent: metadata?.userAgent,
      createdAt: now,
      expiresAt: now + this.ttlMs,
      lastActivity: now,
    };

    this.sessions.set(session.id, session);
    if (!this.userSessionIds.has(userId)) {
      this.userSessionIds.set(userId, new Set());
    }
    this.userSessionIds.get(userId)!.add(session.id);

    return session;
  }

  async get(sessionId: string): Promise<Session | null> {
    this.cleanup();
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (session.expiresAt < Date.now()) {
      this.destroy(sessionId);
      return null;
    }

    session.lastActivity = Date.now();
    return session;
  }

  async destroy(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      this.userSessionIds.get(session.userId)?.delete(sessionId);
    }
  }

  async destroyAllForUser(userId: string): Promise<number> {
    const sessionIds = this.userSessionIds.get(userId);
    if (!sessionIds) return 0;

    let count = 0;
    for (const id of sessionIds) {
      this.sessions.delete(id);
      count++;
    }
    this.userSessionIds.delete(userId);
    return count;
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    this.cleanup();
    const sessionIds = this.userSessionIds.get(userId);
    if (!sessionIds) return [];
    return Array.from(sessionIds)
      .map((id) => this.sessions.get(id))
      .filter((s): s is Session => s !== undefined);
  }

  async touch(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (session.expiresAt < now) {
        this.destroy(id);
      }
    }
  }

  getActiveSessionCount(): number {
    this.cleanup();
    return this.sessions.size;
  }
}

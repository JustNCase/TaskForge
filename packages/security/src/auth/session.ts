import { randomBytes } from "crypto";
import { getServerClient, findAll, insert, remove } from "@taskforge/database";

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
  persist?: boolean;
}

interface SessionRow {
  id: string;
  user_id: string;
  email: string;
  role: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  expires_at: string;
  last_activity: string;
}

function rowToSession(row: SessionRow): Session {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    role: row.role,
    ip: row.ip ?? undefined,
    userAgent: row.user_agent ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
    expiresAt: new Date(row.expires_at).getTime(),
    lastActivity: new Date(row.last_activity).getTime(),
  };
}

function sessionToRow(session: Session): Record<string, unknown> {
  return {
    id: session.id,
    user_id: session.userId,
    email: session.email,
    role: session.role,
    ip: session.ip ?? null,
    user_agent: session.userAgent ?? null,
    created_at: new Date(session.createdAt).toISOString(),
    expires_at: new Date(session.expiresAt).toISOString(),
    last_activity: new Date(session.lastActivity).toISOString(),
  };
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private userSessionIds: Map<string, Set<string>> = new Map();
  private ttlMs: number;
  private maxSessionsPerUser: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any | null = null;
  private ready: Promise<void>;

  constructor(options?: SessionOptions) {
    this.ttlMs = options?.ttlMs || 86400000;
    this.maxSessionsPerUser = options?.maxSessionsPerUser || 10;

    if (options?.persist) {
      try {
        this.db = getServerClient();
      } catch (err) {
        console.warn("[SessionManager] Failed to get Supabase client, falling back to in-memory:", err);
        this.db = null;
      }
    }

    this.ready = this.db ? this.loadFromDb() : Promise.resolve();
  }

  private async loadFromDb(): Promise<void> {
    try {
      const rows = await findAll<SessionRow>(this.db, "sessions");
      for (const row of rows) {
        const session = rowToSession(row);
        if (session.expiresAt < Date.now()) continue;
        this.sessions.set(session.id, session);
        if (!this.userSessionIds.has(session.userId)) {
          this.userSessionIds.set(session.userId, new Set());
        }
        this.userSessionIds.get(session.userId)!.add(session.id);
      }
    } catch (err) {
      console.warn("[SessionManager] Failed to load sessions from DB:", err);
    }
  }

  async create(userId: string, email: string, role: string, metadata?: { ip?: string; userAgent?: string }): Promise<Session> {
    await this.ready;
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

    if (this.db) {
      try {
        await insert(this.db, "sessions", sessionToRow(session));
      } catch (err) {
        console.warn("[SessionManager] Failed to persist session to DB:", err);
      }
    }

    return session;
  }

  async get(sessionId: string): Promise<Session | null> {
    await this.ready;
    this.cleanup();
    const session = this.sessions.get(sessionId);
    if (!session) {
      if (this.db) {
        try {
          const rows = await findAll<SessionRow>(this.db, "sessions", { filters: { id: sessionId } });
          if (rows.length > 0) {
            const dbSession = rowToSession(rows[0]);
            if (dbSession.expiresAt < Date.now()) {
              this.destroy(sessionId);
              return null;
            }
            dbSession.lastActivity = Date.now();
            this.sessions.set(dbSession.id, dbSession);
            if (!this.userSessionIds.has(dbSession.userId)) {
              this.userSessionIds.set(dbSession.userId, new Set());
            }
            this.userSessionIds.get(dbSession.userId)!.add(dbSession.id);
            return dbSession;
          }
        } catch (err) {
          console.warn("[SessionManager] Failed to read session from DB:", err);
        }
      }
      return null;
    }

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
    if (this.db) {
      try {
        await remove(this.db, "sessions", sessionId);
      } catch (err) {
        console.warn("[SessionManager] Failed to delete session from DB:", err);
      }
    }
  }

  async destroyAllForUser(userId: string): Promise<number> {
    await this.ready;
    const sessionIds = this.userSessionIds.get(userId);
    if (!sessionIds) return 0;

    let count = 0;
    for (const id of sessionIds) {
      this.sessions.delete(id);
      count++;
    }
    this.userSessionIds.delete(userId);

    if (this.db) {
      try {
        await this.db.from("sessions").delete().eq("user_id", userId);
      } catch (err) {
        console.warn("[SessionManager] Failed to delete user sessions from DB:", err);
      }
    }

    return count;
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    await this.ready;
    this.cleanup();
    const sessionIds = this.userSessionIds.get(userId);
    const memorySessions = sessionIds
      ? Array.from(sessionIds)
          .map((id) => this.sessions.get(id))
          .filter((s): s is Session => s !== undefined)
      : [];

    if (memorySessions.length > 0 || !this.db) return memorySessions;

    try {
      const rows = await findAll<SessionRow>(this.db, "sessions", { filters: { user_id: userId } });
      const now = Date.now();
      const dbSessions: Session[] = [];
      for (const row of rows) {
        const session = rowToSession(row);
        if (session.expiresAt < now) continue;
        this.sessions.set(session.id, session);
        if (!this.userSessionIds.has(userId)) {
          this.userSessionIds.set(userId, new Set());
        }
        this.userSessionIds.get(userId)!.add(session.id);
        dbSessions.push(session);
      }
      return dbSessions;
    } catch (err) {
      console.warn("[SessionManager] Failed to load user sessions from DB:", err);
      return memorySessions;
    }
  }

  async touch(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
    if (this.db) {
      try {
        await this.db
          .from("sessions")
          .update({ last_activity: new Date().toISOString() })
          .eq("id", sessionId);
      } catch (err) {
        console.warn("[SessionManager] Failed to update session in DB:", err);
      }
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

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
export declare class SessionManager {
    private sessions;
    private userSessionIds;
    private ttlMs;
    private maxSessionsPerUser;
    constructor(options?: SessionOptions);
    create(userId: string, email: string, role: string, metadata?: {
        ip?: string;
        userAgent?: string;
    }): Promise<Session>;
    get(sessionId: string): Promise<Session | null>;
    destroy(sessionId: string): Promise<void>;
    destroyAllForUser(userId: string): Promise<number>;
    getUserSessions(userId: string): Promise<Session[]>;
    touch(sessionId: string): Promise<void>;
    private cleanup;
    getActiveSessionCount(): number;
}
//# sourceMappingURL=session.d.ts.map
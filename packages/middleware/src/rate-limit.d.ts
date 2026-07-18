import type { IncomingMessage, ServerResponse } from "http";
export interface RateLimitOptions {
    windowMs?: number;
    maxRequests?: number;
    keyBy?: "ip" | "user" | "api-key";
    message?: string;
    headers?: boolean;
}
export declare function createRateLimitMiddleware(options?: RateLimitOptions): (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
export declare function createApiRateLimit(): (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
export declare function createUserRateLimit(): (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
export declare function createStrictRateLimit(): (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
//# sourceMappingURL=rate-limit.d.ts.map
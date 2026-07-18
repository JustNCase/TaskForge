import type { IncomingMessage, ServerResponse } from "http";
import type { JWTPayload } from "@taskforge/security";
export interface AuthenticatedRequest extends IncomingMessage {
    user?: JWTPayload;
}
export declare function createAuthMiddleware(options?: {
    publicRoutes?: string[];
}): (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
export declare function requireRole(...roles: string[]): (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
//# sourceMappingURL=auth.d.ts.map
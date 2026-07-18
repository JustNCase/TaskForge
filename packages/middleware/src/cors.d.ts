import type { IncomingMessage, ServerResponse } from "http";
export interface CorsOptions {
    origin?: string | string[] | ((origin: string | undefined) => string | null);
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
}
export declare function createCorsMiddleware(options?: CorsOptions): (req: IncomingMessage, res: ServerResponse, next: () => void) => void;
//# sourceMappingURL=cors.d.ts.map
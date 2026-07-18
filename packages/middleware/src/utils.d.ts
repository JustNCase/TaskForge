import type { IncomingMessage, ServerResponse } from "http";
export declare function sendJSON(res: ServerResponse, status: number, data: unknown): void;
export declare function readBody(req: IncomingMessage): Promise<string>;
export declare function readJSON(req: IncomingMessage): Promise<any>;
export declare function getQueryParams(req: IncomingMessage): URLSearchParams;
export declare function getPathParam(req: IncomingMessage, prefix: string): string | null;
export declare function compose(...middlewares: Array<(req: IncomingMessage, res: ServerResponse, next: () => void) => void>): (req: IncomingMessage, res: ServerResponse, done: () => void) => void;
//# sourceMappingURL=utils.d.ts.map
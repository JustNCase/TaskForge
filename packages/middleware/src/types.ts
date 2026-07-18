import type { IncomingMessage, ServerResponse } from "http";

export interface AuthenticatedRequest extends IncomingMessage {
  user?: {
    sub: string;
    role?: string;
    email?: string;
  };
}

export type NextFunction = () => void;

export type MiddlewareFn = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
) => void;

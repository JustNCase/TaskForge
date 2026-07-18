export function rateLimitMiddleware(_maxRequests: number = 100, _windowMs: number = 60000) {
  return function (_req: unknown, _res: unknown, next: () => void) {
    next();
  };
}

const stores = new Map();
function getStore(name) {
    if (!stores.has(name)) {
        stores.set(name, new Map());
    }
    return stores.get(name);
}
function getKey(req, keyBy) {
    if (keyBy === "ip") {
        return req.socket.remoteAddress || "unknown";
    }
    if (keyBy === "api-key") {
        const apiKey = req.headers["x-api-key"];
        if (typeof apiKey === "string" && apiKey)
            return `apikey:${apiKey}`;
        return req.socket.remoteAddress || "unknown";
    }
    return req.socket.remoteAddress || "unknown";
}
export function createRateLimitMiddleware(options) {
    const windowMs = options?.windowMs || 60000;
    const maxRequests = options?.maxRequests || 100;
    const keyBy = options?.keyBy || "ip";
    const message = options?.message || "Rate limit exceeded";
    const showHeaders = options?.headers !== false;
    const storeName = `ratelimit_${keyBy}_${windowMs}_${maxRequests}`;
    const store = getStore(storeName);
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store) {
            if (now > entry.resetAt) {
                store.delete(key);
            }
        }
    }, windowMs);
    return function rateLimitMiddleware(req, res, next) {
        if (req.method === "OPTIONS") {
            return next();
        }
        const key = getKey(req, keyBy);
        const now = Date.now();
        let entry = store.get(key);
        if (!entry || now > entry.resetAt) {
            entry = { count: 1, resetAt: now + windowMs };
            store.set(key, entry);
            if (showHeaders) {
                res.setHeader("X-RateLimit-Limit", maxRequests);
                res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
                res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));
            }
            return next();
        }
        if (entry.count >= maxRequests) {
            res.writeHead(429, { "Content-Type": "application/json" });
            res.setHeader("X-RateLimit-Limit", maxRequests);
            res.setHeader("X-RateLimit-Remaining", 0);
            res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));
            res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
            res.end(JSON.stringify({ error: message }));
            return;
        }
        entry.count++;
        if (showHeaders) {
            res.setHeader("X-RateLimit-Limit", maxRequests);
            res.setHeader("X-RateLimit-Remaining", maxRequests - entry.count);
            res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));
        }
        next();
    };
}
export function createApiRateLimit() {
    return createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 100,
        keyBy: "api-key",
    });
}
export function createUserRateLimit() {
    return createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 60,
        keyBy: "user",
    });
}
export function createStrictRateLimit() {
    return createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 20,
        keyBy: "ip",
        message: "Too many requests - please slow down",
    });
}
//# sourceMappingURL=rate-limit.js.map
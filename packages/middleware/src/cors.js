function getDefaultOrigin() {
    const origins = [];
    if (process.env.DASHBOARD_URL)
        origins.push(process.env.DASHBOARD_URL);
    if (process.env.WEB_URL)
        origins.push(process.env.WEB_URL);
    if (process.env.CORS_ORIGINS) {
        origins.push(...process.env.CORS_ORIGINS.split(",").map((o) => o.trim()));
    }
    if (origins.length === 0) {
        origins.push("http://localhost:3000", "http://localhost:3001");
    }
    return origins;
}
export function createCorsMiddleware(options) {
    const methods = options?.methods || ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];
    const allowedHeaders = options?.allowedHeaders || ["Content-Type", "Authorization", "X-API-Key"];
    const exposedHeaders = options?.exposedHeaders || [
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
    ];
    const credentials = options?.credentials !== false;
    const maxAge = options?.maxAge || 86400;
    const originOption = options?.origin;
    const allowedOrigins = Array.isArray(originOption)
        ? originOption
        : typeof originOption === "string"
            ? [originOption]
            : [];
    function isOriginAllowed(origin) {
        if (!origin)
            return allowedOrigins[0] || null;
        if (allowedOrigins.includes(origin))
            return origin;
        if (allowedOrigins.includes("*"))
            return "*";
        if (typeof originOption === "function")
            return originOption(origin);
        return null;
    }
    return function corsMiddleware(req, res, next) {
        const origin = req.headers.origin;
        const allowedOrigin = isOriginAllowed(origin);
        if (allowedOrigin) {
            res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
        }
        if (credentials) {
            res.setHeader("Access-Control-Allow-Credentials", "true");
        }
        if (exposedHeaders.length > 0) {
            res.setHeader("Access-Control-Expose-Headers", exposedHeaders.join(", "));
        }
        if (req.method === "OPTIONS") {
            res.writeHead(204, {
                "Access-Control-Allow-Methods": methods.join(", "),
                "Access-Control-Allow-Headers": allowedHeaders.join(", "),
                "Access-Control-Max-Age": String(maxAge),
            });
            res.end();
            return;
        }
        next();
    };
}
//# sourceMappingURL=cors.js.map
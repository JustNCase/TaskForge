export function sendJSON(res, status, data) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}
export function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => resolve(body));
        req.on("error", reject);
    });
}
export function readJSON(req) {
    return readBody(req).then((body) => JSON.parse(body));
}
export function getQueryParams(req) {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    return url.searchParams;
}
export function getPathParam(req, prefix) {
    const path = req.url?.split("?")[0] || "";
    if (!path.startsWith(prefix))
        return null;
    return path.slice(prefix.length) || null;
}
export function compose(...middlewares) {
    return function composed(req, res, done) {
        let index = 0;
        function next() {
            if (index >= middlewares.length) {
                return done();
            }
            const middleware = middlewares[index++];
            middleware(req, res, next);
        }
        next();
    };
}
//# sourceMappingURL=utils.js.map
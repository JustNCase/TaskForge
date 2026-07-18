import { randomBytes } from "crypto";
export class OAuth2Manager {
    clients = new Map();
    authorizations = new Map();
    tokens = new Map();
    tokenExpiryMs = 3600000;
    refreshExpiryMs = 2592000000;
    registerClient(client) {
        const clientId = `gen_${randomBytes(8).toString("hex")}`;
        const clientSecret = randomBytes(24).toString("hex");
        const full = { ...client, clientId, clientSecret };
        this.clients.set(clientId, full);
        return full;
    }
    getClient(clientId) {
        return this.clients.get(clientId);
    }
    validateClient(clientId, clientSecret) {
        const client = this.clients.get(clientId);
        if (!client)
            return false;
        return timingSafeEqual(client.clientSecret, clientSecret);
    }
    createAuthorizationCode(clientId, userId, redirectUri, scope) {
        const code = randomBytes(16).toString("hex");
        this.authorizations.set(code, {
            code,
            clientId,
            userId,
            redirectUri,
            scope,
            expiresAt: Date.now() + 600000,
            used: false,
        });
        return code;
    }
    exchangeAuthorizationCode(code, clientId, clientSecret, redirectUri) {
        if (!this.validateClient(clientId, clientSecret))
            return null;
        const auth = this.authorizations.get(code);
        if (!auth || auth.used || auth.expiresAt < Date.now())
            return null;
        if (auth.clientId !== clientId || auth.redirectUri !== redirectUri)
            return null;
        auth.used = true;
        this.authorizations.delete(code);
        return this.createToken(auth.userId, clientId, auth.scope);
    }
    exchangeRefreshToken(refreshToken, clientId, clientSecret) {
        if (!this.validateClient(clientId, clientSecret))
            return null;
        for (const [tokenStr, token] of this.tokens) {
            if (token.refreshToken === refreshToken && token.clientId === clientId) {
                this.tokens.delete(tokenStr);
                return this.createToken(token.userId, clientId, token.scope);
            }
        }
        return null;
    }
    validateToken(accessToken) {
        const token = this.tokens.get(accessToken);
        if (!token)
            return null;
        if (token.createdAt + token.expiresIn * 1000 < Date.now()) {
            this.tokens.delete(accessToken);
            return null;
        }
        return token;
    }
    revokeToken(accessToken) {
        return this.tokens.delete(accessToken);
    }
    createToken(userId, clientId, scope) {
        const accessToken = randomBytes(32).toString("hex");
        const refreshToken = randomBytes(24).toString("hex");
        const token = {
            accessToken,
            refreshToken,
            tokenType: "Bearer",
            expiresIn: this.tokenExpiryMs / 1000,
            scope,
            userId,
            clientId,
            createdAt: Date.now(),
        };
        this.tokens.set(accessToken, token);
        return token;
    }
}
function timingSafeEqual(a, b) {
    if (a.length !== b.length)
        return false;
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    try {
        const { timingSafeEqual: tse } = require("crypto");
        return tse(aBuf, bBuf);
    }
    catch {
        let result = 0;
        for (let i = 0; i < aBuf.length; i++)
            result |= aBuf[i] ^ bBuf[i];
        return result === 0;
    }
}
//# sourceMappingURL=index.js.map
import { createHmac, timingSafeEqual } from "crypto";
export class JWTManager {
    secret;
    defaultExpiry;
    constructor(secret, defaultExpiryMs = 3600000) {
        if (!secret && !process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET environment variable or constructor secret is required");
        }
        this.secret = secret || process.env.JWT_SECRET;
        this.defaultExpiry = defaultExpiryMs;
    }
    sign(payload, options) {
        const header = { alg: "HS256", typ: "JWT" };
        const now = Math.floor(Date.now() / 1000);
        const tokenPayload = {
            ...payload,
            iat: now,
            exp: now + (options?.expiresIn || this.defaultExpiry) / 1000,
            jti: options?.jti || this.generateJTI(),
        };
        const headerB64 = this.base64UrlEncode(JSON.stringify(header));
        const payloadB64 = this.base64UrlEncode(JSON.stringify(tokenPayload));
        const signature = this.signature(`${headerB64}.${payloadB64}`);
        return `${headerB64}.${payloadB64}.${signature}`;
    }
    verify(token) {
        try {
            const parts = token.split(".");
            if (parts.length !== 3)
                return null;
            const [headerB64, payloadB64, signature] = parts;
            const expectedSig = this.signature(`${headerB64}.${payloadB64}`);
            const sigBuffer = Buffer.from(signature, "base64url");
            const expectedBuffer = Buffer.from(expectedSig, "base64url");
            if (sigBuffer.length !== expectedBuffer.length)
                return null;
            if (!timingSafeEqual(sigBuffer, expectedBuffer))
                return null;
            const payload = JSON.parse(this.base64UrlDecode(payloadB64));
            if (payload.exp < Math.floor(Date.now() / 1000))
                return null;
            return payload;
        }
        catch {
            return null;
        }
    }
    decode(token) {
        try {
            const parts = token.split(".");
            if (parts.length !== 3)
                return null;
            return JSON.parse(this.base64UrlDecode(parts[1]));
        }
        catch {
            return null;
        }
    }
    refresh(token) {
        const payload = this.verify(token);
        if (!payload)
            return null;
        return this.sign({
            sub: payload.sub,
            role: payload.role,
            email: payload.email,
        });
    }
    signature(data) {
        return createHmac("sha256", this.secret).update(data).digest("base64url");
    }
    generateJTI() {
        const { randomBytes } = require("crypto");
        return randomBytes(16).toString("hex");
    }
    base64UrlEncode(data) {
        return Buffer.from(data).toString("base64url");
    }
    base64UrlDecode(data) {
        return Buffer.from(data, "base64url").toString("utf8");
    }
}
//# sourceMappingURL=jwt.js.map
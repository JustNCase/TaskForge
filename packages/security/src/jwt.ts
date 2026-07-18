import { createHmac, timingSafeEqual } from "crypto";

export interface JWTHeader {
  alg: "HS256";
  typ: "JWT";
}

export interface JWTPayload {
  sub: string;
  role?: string;
  email?: string;
  iat: number;
  exp: number;
  jti?: string;
}

export interface JWTSignOptions {
  expiresIn?: number;
  jti?: string;
}

export class JWTManager {
  private secret: string;
  private defaultExpiry: number;

  constructor(secret?: string, defaultExpiryMs = 3600000) {
    this.secret = secret || process.env.JWT_SECRET || "genesis-default-secret-change-in-production";
    this.defaultExpiry = defaultExpiryMs;
  }

  sign(payload: Omit<JWTPayload, "iat" | "exp">, options?: JWTSignOptions): string {
    const header: JWTHeader = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const tokenPayload: JWTPayload = {
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

  verify(token: string): JWTPayload | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const [headerB64, payloadB64, signature] = parts;
      const expectedSig = this.signature(`${headerB64}.${payloadB64}`);

      const sigBuffer = Buffer.from(signature, "base64url");
      const expectedBuffer = Buffer.from(expectedSig, "base64url");

      if (sigBuffer.length !== expectedBuffer.length) return null;
      if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;

      const payload = JSON.parse(this.base64UrlDecode(payloadB64)) as JWTPayload;
      if (payload.exp < Math.floor(Date.now() / 1000)) return null;

      return payload;
    } catch {
      return null;
    }
  }

  decode(token: string): JWTPayload | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      return JSON.parse(this.base64UrlDecode(parts[1])) as JWTPayload;
    } catch {
      return null;
    }
  }

  refresh(token: string): string | null {
    const payload = this.verify(token);
    if (!payload) return null;
    return this.sign({
      sub: payload.sub,
      role: payload.role,
      email: payload.email,
    });
  }

  private signature(data: string): string {
    return createHmac("sha256", this.secret).update(data).digest("base64url");
  }

  private generateJTI(): string {
    const { randomBytes } = require("crypto");
    return randomBytes(16).toString("hex");
  }

  private base64UrlEncode(data: string): string {
    return Buffer.from(data).toString("base64url");
  }

  private base64UrlDecode(data: string): string {
    return Buffer.from(data, "base64url").toString("utf8");
  }
}

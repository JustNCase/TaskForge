import { randomBytes, createHash } from "crypto";

export interface OAuth2Client {
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  grants: string[];
  scopes: string[];
  name: string;
}

export interface OAuth2Token {
  accessToken: string;
  refreshToken?: string;
  tokenType: "Bearer";
  expiresIn: number;
  scope: string;
  userId: string;
  clientId: string;
  createdAt: number;
}

export interface OAuth2Authorization {
  code: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: string;
  expiresAt: number;
  used: boolean;
}

export class OAuth2Manager {
  private clients: Map<string, OAuth2Client> = new Map();
  private authorizations: Map<string, OAuth2Authorization> = new Map();
  private tokens: Map<string, OAuth2Token> = new Map();
  private tokenExpiryMs = 3600000;
  private refreshExpiryMs = 2592000000;

  registerClient(client: Omit<OAuth2Client, "clientId" | "clientSecret">): OAuth2Client {
    const clientId = `gen_${randomBytes(8).toString("hex")}`;
    const clientSecret = randomBytes(24).toString("hex");
    const full: OAuth2Client = { ...client, clientId, clientSecret };
    this.clients.set(clientId, full);
    return full;
  }

  getClient(clientId: string): OAuth2Client | undefined {
    return this.clients.get(clientId);
  }

  validateClient(clientId: string, clientSecret: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;
    return timingSafeEqual(client.clientSecret, clientSecret);
  }

  createAuthorizationCode(clientId: string, userId: string, redirectUri: string, scope: string): string {
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

  exchangeAuthorizationCode(code: string, clientId: string, clientSecret: string, redirectUri: string): OAuth2Token | null {
    if (!this.validateClient(clientId, clientSecret)) return null;

    const auth = this.authorizations.get(code);
    if (!auth || auth.used || auth.expiresAt < Date.now()) return null;
    if (auth.clientId !== clientId || auth.redirectUri !== redirectUri) return null;

    auth.used = true;
    this.authorizations.delete(code);

    return this.createToken(auth.userId, clientId, auth.scope);
  }

  exchangeRefreshToken(refreshToken: string, clientId: string, clientSecret: string): OAuth2Token | null {
    if (!this.validateClient(clientId, clientSecret)) return null;

    for (const [tokenStr, token] of this.tokens) {
      if (token.refreshToken === refreshToken && token.clientId === clientId) {
        this.tokens.delete(tokenStr);
        return this.createToken(token.userId, clientId, token.scope);
      }
    }

    return null;
  }

  validateToken(accessToken: string): OAuth2Token | null {
    const token = this.tokens.get(accessToken);
    if (!token) return null;
    if (token.createdAt + token.expiresIn * 1000 < Date.now()) {
      this.tokens.delete(accessToken);
      return null;
    }
    return token;
  }

  revokeToken(accessToken: string): boolean {
    return this.tokens.delete(accessToken);
  }

  private createToken(userId: string, clientId: string, scope: string): OAuth2Token {
    const accessToken = randomBytes(32).toString("hex");
    const refreshToken = randomBytes(24).toString("hex");
    const token: OAuth2Token = {
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

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  try {
    const { timingSafeEqual: tse } = require("crypto");
    return tse(aBuf, bBuf);
  } catch {
    let result = 0;
    for (let i = 0; i < aBuf.length; i++) result |= aBuf[i] ^ bBuf[i];
    return result === 0;
  }
}

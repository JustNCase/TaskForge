import { randomBytes, createHash } from "crypto";
import { getServerClient, findAll, insert, remove } from "@taskforge/database";

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

interface OAuth2ClientRow {
  client_id: string;
  client_secret: string;
  redirect_uris: string[] | string;
  grants: string[] | string;
  scopes: string[] | string;
  name: string;
}

interface OAuth2AuthorizationRow {
  code: string;
  client_id: string;
  user_id: string;
  redirect_uri: string;
  scope: string;
  expires_at: string;
  used: boolean;
}

interface OAuth2TokenRow {
  access_token: string;
  refresh_token: string | null;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: string;
  client_id: string;
  created_at: string;
}

function rowToClient(row: OAuth2ClientRow): OAuth2Client {
  return {
    clientId: row.client_id,
    clientSecret: row.client_secret,
    redirectUris: typeof row.redirect_uris === "string" ? JSON.parse(row.redirect_uris) : row.redirect_uris,
    grants: typeof row.grants === "string" ? JSON.parse(row.grants) : row.grants,
    scopes: typeof row.scopes === "string" ? JSON.parse(row.scopes) : row.scopes,
    name: row.name,
  };
}

function clientToRow(client: OAuth2Client): Record<string, unknown> {
  return {
    client_id: client.clientId,
    client_secret: client.clientSecret,
    redirect_uris: JSON.stringify(client.redirectUris),
    grants: JSON.stringify(client.grants),
    scopes: JSON.stringify(client.scopes),
    name: client.name,
  };
}

function rowToAuthorization(row: OAuth2AuthorizationRow): OAuth2Authorization {
  return {
    code: row.code,
    clientId: row.client_id,
    userId: row.user_id,
    redirectUri: row.redirect_uri,
    scope: row.scope,
    expiresAt: new Date(row.expires_at).getTime(),
    used: row.used,
  };
}

function authorizationToRow(auth: OAuth2Authorization): Record<string, unknown> {
  return {
    code: auth.code,
    client_id: auth.clientId,
    user_id: auth.userId,
    redirect_uri: auth.redirectUri,
    scope: auth.scope,
    expires_at: new Date(auth.expiresAt).toISOString(),
    used: auth.used,
  };
}

function rowToToken(row: OAuth2TokenRow): OAuth2Token {
  return {
    accessToken: row.access_token,
    refreshToken: row.refresh_token ?? undefined,
    tokenType: "Bearer",
    expiresIn: row.expires_in,
    scope: row.scope,
    userId: row.user_id,
    clientId: row.client_id,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function tokenToRow(token: OAuth2Token): Record<string, unknown> {
  return {
    access_token: token.accessToken,
    refresh_token: token.refreshToken ?? null,
    token_type: token.tokenType,
    expires_in: token.expiresIn,
    scope: token.scope,
    user_id: token.userId,
    client_id: token.clientId,
    created_at: new Date(token.createdAt).toISOString(),
  };
}

export class OAuth2Manager {
  private clients: Map<string, OAuth2Client> = new Map();
  private authorizations: Map<string, OAuth2Authorization> = new Map();
  private tokens: Map<string, OAuth2Token> = new Map();
  private tokenExpiryMs = 3600000;
  private refreshExpiryMs = 2592000000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any | null = null;
  private ready: Promise<void>;

  constructor(persist?: boolean) {
    if (persist) {
      try {
        this.db = getServerClient();
      } catch (err) {
        console.warn("[OAuth2Manager] Failed to get Supabase client, falling back to in-memory:", err);
        this.db = null;
      }
    }

    this.ready = this.db ? this.loadFromDb() : Promise.resolve();
  }

  private async loadFromDb(): Promise<void> {
    try {
      const clientRows = await findAll<OAuth2ClientRow>(this.db, "oauth2_clients");
      for (const row of clientRows) {
        this.clients.set(row.client_id, rowToClient(row));
      }
      const authRows = await findAll<OAuth2AuthorizationRow>(this.db, "oauth2_authorizations");
      const now = Date.now();
      for (const row of authRows) {
        const auth = rowToAuthorization(row);
        if (!auth.used && auth.expiresAt > now) {
          this.authorizations.set(auth.code, auth);
        }
      }
      const tokenRows = await findAll<OAuth2TokenRow>(this.db, "oauth2_tokens");
      for (const row of tokenRows) {
        const token = rowToToken(row);
        if (token.createdAt + token.expiresIn * 1000 > now) {
          this.tokens.set(token.accessToken, token);
        }
      }
    } catch (err) {
      console.warn("[OAuth2Manager] Failed to load OAuth2 data from DB:", err);
    }
  }

  registerClient(client: Omit<OAuth2Client, "clientId" | "clientSecret">): OAuth2Client {
    const clientId = `gen_${randomBytes(8).toString("hex")}`;
    const clientSecret = randomBytes(24).toString("hex");
    const full: OAuth2Client = { ...client, clientId, clientSecret };
    this.clients.set(clientId, full);

    if (this.db) {
      try {
        insert(this.db, "oauth2_clients", clientToRow(full)).catch((err: Error) => {
          console.warn("[OAuth2Manager] Failed to persist client to DB:", err);
        });
      } catch (err) {
        console.warn("[OAuth2Manager] Failed to persist client to DB:", err);
      }
    }

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
    const auth: OAuth2Authorization = {
      code,
      clientId,
      userId,
      redirectUri,
      scope,
      expiresAt: Date.now() + 600000,
      used: false,
    };
    this.authorizations.set(code, auth);

    if (this.db) {
      try {
        insert(this.db, "oauth2_authorizations", authorizationToRow(auth)).catch((err: Error) => {
          console.warn("[OAuth2Manager] Failed to persist authorization to DB:", err);
        });
      } catch (err) {
        console.warn("[OAuth2Manager] Failed to persist authorization to DB:", err);
      }
    }

    return code;
  }

  exchangeAuthorizationCode(code: string, clientId: string, clientSecret: string, redirectUri: string): OAuth2Token | null {
    if (!this.validateClient(clientId, clientSecret)) return null;

    const auth = this.authorizations.get(code);
    if (!auth || auth.used || auth.expiresAt < Date.now()) return null;
    if (auth.clientId !== clientId || auth.redirectUri !== redirectUri) return null;

    auth.used = true;
    this.authorizations.delete(code);

    if (this.db) {
      try {
        this.db.from("oauth2_authorizations").delete().eq("code", code).then(() => {}).catch((err: Error) => {
          console.warn("[OAuth2Manager] Failed to delete authorization from DB:", err);
        });
      } catch (err) {
        console.warn("[OAuth2Manager] Failed to delete authorization from DB:", err);
      }
    }

    return this.createToken(auth.userId, clientId, auth.scope);
  }

  exchangeRefreshToken(refreshToken: string, clientId: string, clientSecret: string): OAuth2Token | null {
    if (!this.validateClient(clientId, clientSecret)) return null;

    for (const [tokenStr, token] of this.tokens) {
      if (token.refreshToken === refreshToken && token.clientId === clientId) {
        this.tokens.delete(tokenStr);

        if (this.db) {
          try {
            this.db.from("oauth2_tokens").delete().eq("access_token", tokenStr).then(() => {}).catch((err: Error) => {
              console.warn("[OAuth2Manager] Failed to delete old token from DB:", err);
            });
          } catch (err) {
            console.warn("[OAuth2Manager] Failed to delete old token from DB:", err);
          }
        }

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

      if (this.db) {
        try {
          this.db.from("oauth2_tokens").delete().eq("access_token", accessToken).then(() => {}).catch((err: Error) => {
            console.warn("[OAuth2Manager] Failed to delete expired token from DB:", err);
          });
        } catch (err) {
          console.warn("[OAuth2Manager] Failed to delete expired token from DB:", err);
        }
      }

      return null;
    }
    return token;
  }

  revokeToken(accessToken: string): boolean {
    const result = this.tokens.delete(accessToken);

    if (this.db) {
      try {
        this.db.from("oauth2_tokens").delete().eq("access_token", accessToken).then(() => {}).catch((err: Error) => {
          console.warn("[OAuth2Manager] Failed to revoke token from DB:", err);
        });
      } catch (err) {
        console.warn("[OAuth2Manager] Failed to revoke token from DB:", err);
      }
    }

    return result;
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

    if (this.db) {
      try {
        insert(this.db, "oauth2_tokens", tokenToRow(token)).catch((err: Error) => {
          console.warn("[OAuth2Manager] Failed to persist token to DB:", err);
        });
      } catch (err) {
        console.warn("[OAuth2Manager] Failed to persist token to DB:", err);
      }
    }

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

import type { IncomingMessage, ServerResponse } from "http";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { query, execute } from "../db";
import {
  AuthProvider, JWTManager, TOTPManager, WebAuthnManager, OAuth2Manager,
  PermissionManager, SessionManager, Encryption,
  type Role,
} from "@taskforge/security";

const JWT_SECRET = process.env.JWT_SECRET || "genesis-dev-secret-change-in-production";
const JWT_EXPIRES_IN = "24h";

const securityAuth = new AuthProvider(JWT_SECRET);
const securityJWT = new JWTManager(JWT_SECRET);
const securityTOTP = new TOTPManager();
const securityWebAuthn = new WebAuthnManager();
const securityOAuth2 = new OAuth2Manager();
const securityPermissions = new PermissionManager();
const securitySessions = new SessionManager();

interface UserRow {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sendJSON(res: ServerResponse, status: number, data: object): void {
  res.writeHead(status);
  res.end(JSON.stringify(data));
}

function sanitizeUser(user: UserRow) {
  const { password, ...rest } = user;
  return rest;
}

function generateToken(user: UserRow): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function getTokenFromHeader(req: IncomingMessage): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

function verifyToken(token: string): { sub: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function handleAuth(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const path = url.pathname.replace("/api/auth", "");

  if (path === "/register" && req.method === "POST") {
    return handleRegister(req, res);
  }

  if (path === "/login" && req.method === "POST") {
    return handleLogin(req, res);
  }

  if (path === "/me" && req.method === "GET") {
    return handleMe(req, res);
  }

  if (path === "/profile" && req.method === "PUT") {
    return handleUpdateProfile(req, res);
  }

  if (path === "/users" && req.method === "GET") {
    return handleListUsers(req, res);
  }

  if (path === "/mfa/enable" && req.method === "POST") return handleMFAEnable(req, res);
  if (path === "/mfa/disable" && req.method === "POST") return handleMFADisable(req, res);
  if (path === "/mfa/verify" && req.method === "POST") return handleMFAVerify(req, res);
  if (path === "/mfa/setup" && req.method === "GET") return handleMFASetup(req, res);

  if (path === "/webauthn/register/begin" && req.method === "POST") return handleWebAuthnRegisterBegin(req, res);
  if (path === "/webauthn/register/complete" && req.method === "POST") return handleWebAuthnRegisterComplete(req, res);
  if (path === "/webauthn/login/begin" && req.method === "POST") return handleWebAuthnLoginBegin(req, res);
  if (path === "/webauthn/login/complete" && req.method === "POST") return handleWebAuthnLoginComplete(req, res);
  if (path === "/webauthn/credentials" && req.method === "GET") return handleWebAuthnCredentials(req, res);

  if (path === "/oauth2/clients" && req.method === "POST") return handleOAuth2RegisterClient(req, res);
  if (path === "/oauth2/clients" && req.method === "GET") return handleOAuth2ListClients(req, res);
  if (path === "/oauth2/authorize" && req.method === "POST") return handleOAuth2Authorize(req, res);
  if (path === "/oauth2/token" && req.method === "POST") return handleOAuth2Token(req, res);
  if (path === "/oauth2/validate" && req.method === "POST") return handleOAuth2Validate(req, res);
  if (path === "/oauth2/revoke" && req.method === "POST") return handleOAuth2Revoke(req, res);

  if (path === "/sessions" && req.method === "GET") return handleListSessions(req, res);
  if (path === "/sessions" && req.method === "DELETE") return handleDestroySessions(req, res);
  if (path === "/token/refresh" && req.method === "POST") return handleTokenRefresh(req, res);
  if (path === "/permissions" && req.method === "GET") return handlePermissions(req, res);
  if (path === "/permissions" && req.method === "POST") return handlePermissions(req, res);

  const usersMatch = path.match(/^\/users\/(.+)$/);
  if (usersMatch) {
    const userId = usersMatch[1];
    if (req.method === "PUT") return handleUpdateUser(req, res, userId);
    if (req.method === "DELETE") return handleDeleteUser(req, res, userId);
  }

  sendJSON(res, 404, { error: "Auth endpoint not found" });
}

async function handleRegister(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readBody(req);
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return sendJSON(res, 400, { error: "email, name, and password are required" });
    }

    const existing = query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return sendJSON(res, 409, { error: "Email already registered" });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const hashed = bcrypt.hashSync(password, 10);

    execute(
      "INSERT INTO users (id, email, name, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, email, name, hashed, "user", now, now]
    );

    const user = query("SELECT * FROM users WHERE id = ?", [id])[0] as UserRow;
    const token = generateToken(user);

    sendJSON(res, 201, { token, user: sanitizeUser(user) });
  } catch (err: any) {
    sendJSON(res, 500, { error: err?.message || "Registration failed" });
  }
}

async function handleLogin(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readBody(req);
    const { email, password } = body;

    if (!email || !password) {
      return sendJSON(res, 400, { error: "email and password are required" });
    }

    const users = query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return sendJSON(res, 401, { error: "Invalid email or password" });
    }

    const user = users[0] as UserRow;
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return sendJSON(res, 401, { error: "Invalid email or password" });
    }

    const token = generateToken(user);
    sendJSON(res, 200, { token, user: sanitizeUser(user) });
  } catch (err: any) {
    sendJSON(res, 500, { error: err?.message || "Login failed" });
  }
}

async function handleMe(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const token = getTokenFromHeader(req);
  if (!token) {
    return sendJSON(res, 401, { error: "Authentication required" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return sendJSON(res, 401, { error: "Invalid or expired token" });
  }

  const users = query("SELECT * FROM users WHERE id = ?", [payload.sub]);
  if (users.length === 0) {
    return sendJSON(res, 404, { error: "User not found" });
  }

  sendJSON(res, 200, { user: sanitizeUser(users[0] as UserRow) });
}

async function handleUpdateProfile(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const token = getTokenFromHeader(req);
  if (!token) {
    return sendJSON(res, 401, { error: "Authentication required" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return sendJSON(res, 401, { error: "Invalid or expired token" });
  }

  try {
    const body = await readBody(req);
    const { name, email } = body;
    const now = new Date().toISOString();

    if (email) {
      const existing = query("SELECT id FROM users WHERE email = ? AND id != ?", [email, payload.sub]);
      if (existing.length > 0) {
        return sendJSON(res, 409, { error: "Email already in use" });
      }
      execute("UPDATE users SET email = ?, updatedAt = ? WHERE id = ?", [email, now, payload.sub]);
    }

    if (name) {
      execute("UPDATE users SET name = ?, updatedAt = ? WHERE id = ?", [name, now, payload.sub]);
    }

    const users = query("SELECT * FROM users WHERE id = ?", [payload.sub]);
    sendJSON(res, 200, { user: sanitizeUser(users[0] as UserRow) });
  } catch (err: any) {
    sendJSON(res, 500, { error: err?.message || "Update failed" });
  }
}

async function handleListUsers(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const token = getTokenFromHeader(req);
  if (!token) {
    return sendJSON(res, 401, { error: "Authentication required" });
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return sendJSON(res, 403, { error: "Admin access required" });
  }

  const users = query("SELECT id, email, name, role, createdAt, updatedAt FROM users ORDER BY createdAt DESC");
  sendJSON(res, 200, { users });
}

function requireAdmin(req: IncomingMessage, res: ServerResponse): { sub: string } | null {
  const token = getTokenFromHeader(req);
  if (!token) {
    sendJSON(res, 401, { error: "Authentication required" });
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    sendJSON(res, 401, { error: "Invalid or expired token" });
    return null;
  }

  if (payload.role !== "admin") {
    sendJSON(res, 403, { error: "Admin access required" });
    return null;
  }

  return { sub: payload.sub };
}

async function handleUpdateUser(req: IncomingMessage, res: ServerResponse, userId: string): Promise<void> {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const body = await readBody(req);
    const { name, email, role, password } = body;
    const now = new Date().toISOString();

    const existing = query("SELECT * FROM users WHERE id = ?", [userId]);
    if (existing.length === 0) {
      return sendJSON(res, 404, { error: "User not found" });
    }

    if (email) {
      const dup = query("SELECT id FROM users WHERE email = ? AND id != ?", [email, userId]);
      if (dup.length > 0) {
        return sendJSON(res, 409, { error: "Email already in use" });
      }
      execute("UPDATE users SET email = ?, updatedAt = ? WHERE id = ?", [email, now, userId]);
    }

    if (name) {
      execute("UPDATE users SET name = ?, updatedAt = ? WHERE id = ?", [name, now, userId]);
    }

    if (role) {
      execute("UPDATE users SET role = ?, updatedAt = ? WHERE id = ?", [role, now, userId]);
    }

    if (password) {
      const hashed = bcrypt.hashSync(password, 10);
      execute("UPDATE users SET password = ?, updatedAt = ? WHERE id = ?", [hashed, now, userId]);
    }

    const updated = query("SELECT * FROM users WHERE id = ?", [userId])[0] as UserRow;
    sendJSON(res, 200, { user: sanitizeUser(updated) });
  } catch (err: any) {
    sendJSON(res, 500, { error: err?.message || "Update failed" });
  }
}

async function handleDeleteUser(req: IncomingMessage, res: ServerResponse, userId: string): Promise<void> {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const existing = query("SELECT * FROM users WHERE id = ?", [userId]);
  if (existing.length === 0) {
    return sendJSON(res, 404, { error: "User not found" });
  }

  execute("DELETE FROM users WHERE id = ?", [userId]);
  sendJSON(res, 200, { message: "User deleted" });
}

function getUserIdFromToken(req: IncomingMessage): string | null {
  const token = getTokenFromHeader(req);
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.sub || null;
}

function requireUser(req: IncomingMessage, res: ServerResponse): string | null {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    sendJSON(res, 401, { error: "Authentication required" });
    return null;
  }
  return userId;
}

async function handleMFASetup(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) return;
  const result = await securityAuth.enableMFA(userId);
  if (!result) return sendJSON(res, 404, { error: "User not found" });
  sendJSON(res, 200, { secret: result.secret, uri: result.uri });
}

async function handleMFAEnable(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) return;
  const body = await readBody(req);
  if (!body.code) return sendJSON(res, 400, { error: "MFA code required to enable" });
  const verify = await securityAuth.verifyMFA(userId, body.code);
  if (!verify.success) return sendJSON(res, 400, { error: verify.error || "Invalid code" });
  sendJSON(res, 200, { mfaEnabled: true });
}

async function handleMFADisable(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) return;
  const ok = await securityAuth.disableMFA(userId);
  sendJSON(res, 200, { mfaEnabled: !ok });
}

async function handleMFAVerify(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  const token = getTokenFromHeader(req);
  if (!token || !body.code) return sendJSON(res, 400, { error: "Token and code required" });
  const payload = securityJWT.decode(token);
  if (!payload) return sendJSON(res, 401, { error: "Invalid token" });
  const result = await securityAuth.verifyMFA(payload.sub, body.code);
  if (!result.success) return sendJSON(res, 401, { error: result.error || "MFA failed" });
  sendJSON(res, 200, { token: result.token, user: result.user });
}

async function handleWebAuthnRegisterBegin(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) return;
  const body = await readBody(req);
  const challenge = securityWebAuthn.createRegistrationChallenge(userId, body.email || userId, body.displayName || userId);
  sendJSON(res, 200, { challenge, userId });
}

async function handleWebAuthnRegisterComplete(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) return;
  const body = await readBody(req);
  if (!body.credential) return sendJSON(res, 400, { error: "Credential required" });
  const ok = securityWebAuthn.verifyRegistration(userId, body.credential, body.deviceName);
  sendJSON(res, ok ? 200 : 400, { ok, registered: ok });
}

async function handleWebAuthnLoginBegin(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  const userId = body.userId || getUserIdFromToken(req);
  if (!userId) return sendJSON(res, 400, { error: "userId required" });
  const challenge = securityWebAuthn.createAuthenticationChallenge(userId);
  if (!challenge) return sendJSON(res, 404, { error: "No WebAuthn credentials registered" });
  sendJSON(res, 200, { challenge, userId });
}

async function handleWebAuthnLoginComplete(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  if (!body.userId || !body.credential) return sendJSON(res, 400, { error: "userId and credential required" });
  const ok = securityWebAuthn.verifyAuthentication(body.userId, body.credential);
  if (!ok) return sendJSON(res, 401, { error: "WebAuthn authentication failed" });
  const user = securityAuth.getUser(body.userId) || { id: body.userId, email: body.userId, role: "user" as const, mfaEnabled: false, createdAt: new Date().toISOString() };
  const token = securityJWT.sign({ sub: user.id, role: user.role, email: user.email });
  sendJSON(res, 200, { ok, token, user });
}

async function handleWebAuthnCredentials(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) return;
  const credentials = securityWebAuthn.getCredentials(userId);
  sendJSON(res, 200, { credentials, count: credentials.length });
}

async function handleOAuth2RegisterClient(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) return;
  const body = await readBody(req);
  if (!body.redirectUris || !body.name) return sendJSON(res, 400, { error: "redirectUris and name required" });
  const client = securityOAuth2.registerClient({
    redirectUris: body.redirectUris,
    grants: body.grants || ["authorization_code"],
    scopes: body.scopes || ["read"],
    name: body.name,
  });
  sendJSON(res, 201, { client: { ...client, clientSecret: client.clientSecret } });
}

async function handleOAuth2ListClients(req: IncomingMessage, res: ServerResponse): Promise<void> {
  sendJSON(res, 200, { clients: [] });
}

async function handleOAuth2Authorize(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) return;
  const body = await readBody(req);
  if (!body.clientId || !body.redirectUri) return sendJSON(res, 400, { error: "clientId and redirectUri required" });
  const code = securityOAuth2.createAuthorizationCode(body.clientId, userId, body.redirectUri, body.scope || "read");
  sendJSON(res, 200, { code, redirectUri: body.redirectUri });
}

async function handleOAuth2Token(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  let token: any = null;
  if (body.grant_type === "authorization_code") {
    token = securityOAuth2.exchangeAuthorizationCode(body.code, body.client_id, body.client_secret, body.redirect_uri);
  } else if (body.grant_type === "refresh_token") {
    token = securityOAuth2.exchangeRefreshToken(body.refresh_token, body.client_id, body.client_secret);
  }
  if (!token) return sendJSON(res, 401, { error: "Invalid grant" });
  sendJSON(res, 200, token);
}

async function handleOAuth2Validate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  const token = securityOAuth2.validateToken(body.access_token || body.token);
  sendJSON(res, token ? 200 : 401, token ? { active: true, token } : { active: false });
}

async function handleOAuth2Revoke(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  securityOAuth2.revokeToken(body.access_token || body.token);
  sendJSON(res, 200, { ok: true });
}

async function handleListSessions(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) return;
  const sessions = await securitySessions.getUserSessions(userId);
  sendJSON(res, 200, { sessions, count: sessions.length });
}

async function handleDestroySessions(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) return;
  const count = await securitySessions.destroyAllForUser(userId);
  sendJSON(res, 200, { ok: true, destroyed: count });
}

async function handleTokenRefresh(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  const token = body.token || getTokenFromHeader(req);
  if (!token) return sendJSON(res, 400, { error: "Token required" });
  const refreshed = securityJWT.refresh(token);
  if (!refreshed) return sendJSON(res, 401, { error: "Invalid or expired token" });
  sendJSON(res, 200, { token: refreshed });
}

async function handlePermissions(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = requireUser(req, res);
  if (!userId) return;

  if (req.method === "GET") {
    const perms = securityPermissions.listPermissions(userId);
    const role = securityPermissions.getRole(userId);
    return sendJSON(res, 200, { userId, role, permissions: perms });
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    if (body.role) securityPermissions.setRole(userId, body.role as Role);
    sendJSON(res, 200, { userId, role: body.role });
  }
}

import { Encryption } from "../encryption/index";
import { JWTManager } from "../jwt";
import { TOTPManager } from "../mfa/totp";
import { WebAuthnManager } from "../webauthn/index";
import { OAuth2Manager } from "../oauth2/index";
import { getServerClient, findAll, insert } from "@taskforge/database";

export interface User {
  id: string;
  email: string;
  role: "admin" | "user" | "viewer";
  displayName?: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  requiresMfa?: boolean;
  mfaChallenge?: string;
}

export interface MFAChallenge {
  type: "totp" | "webauthn";
  challenge?: string;
}

export interface AuthProviderOptions {
  jwtSecret?: string;
  persist?: boolean;
}

interface UserRow {
  id: string;
  email: string;
  role: string;
  display_name: string | null;
  mfa_enabled: boolean;
  mfa_secret: string | null;
  created_at: string;
}

interface CredentialRow {
  user_id: string;
  hash: string;
  salt: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role as User["role"],
    displayName: row.display_name ?? undefined,
    mfaEnabled: row.mfa_enabled,
    mfaSecret: row.mfa_secret ?? undefined,
    createdAt: row.created_at,
  };
}

function userToRow(user: User): Record<string, unknown> {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    display_name: user.displayName ?? null,
    mfa_enabled: user.mfaEnabled,
    mfa_secret: user.mfaSecret ?? null,
    created_at: user.createdAt,
  };
}

export class AuthProvider {
  private users: Map<string, User> = new Map();
  private passwords: Map<string, { hash: string; salt: string }> = new Map();
  private jwtManager: JWTManager;
  private totpManager: TOTPManager;
  private webauthnManager: WebAuthnManager;
  private oauth2Manager: OAuth2Manager;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any | null = null;
  private ready: Promise<void>;

  constructor(options?: string | AuthProviderOptions) {
    const opts = typeof options === "string" ? { jwtSecret: options } : options;
    this.jwtManager = new JWTManager(opts?.jwtSecret);
    this.totpManager = new TOTPManager();
    this.webauthnManager = new WebAuthnManager();
    this.oauth2Manager = new OAuth2Manager();

    if (opts?.persist) {
      try {
        this.db = getServerClient();
      } catch (err) {
        console.warn("[AuthProvider] Failed to get Supabase client, falling back to in-memory:", err);
        this.db = null;
      }
    }

    this.ready = this.db ? this.loadFromDb() : Promise.resolve();
  }

  private async loadFromDb(): Promise<void> {
    try {
      const userRows = await findAll<UserRow>(this.db, "users");
      for (const row of userRows) {
        this.users.set(row.id, rowToUser(row));
      }
      const credRows = await findAll<CredentialRow>(this.db, "user_credentials");
      for (const row of credRows) {
        this.passwords.set(row.user_id, { hash: row.hash, salt: row.salt });
      }
    } catch (err) {
      console.warn("[AuthProvider] Failed to load users from DB:", err);
    }
  }

  getJWTManager(): JWTManager { return this.jwtManager; }
  getTOTPManager(): TOTPManager { return this.totpManager; }
  getWebAuthnManager(): WebAuthnManager { return this.webauthnManager; }
  getOAuth2Manager(): OAuth2Manager { return this.oauth2Manager; }

  async register(email: string, password: string, displayName?: string): Promise<AuthResult> {
    await this.ready;
    if (this.users.has(email)) {
      return { success: false, error: "User already exists" };
    }

    const { hash, salt } = Encryption.hashPassword(password);
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email,
      role: "user",
      displayName: displayName || email.split("@")[0],
      mfaEnabled: false,
      createdAt: new Date().toISOString(),
    };

    this.users.set(user.id, user);
    this.passwords.set(user.id, { hash, salt });

    if (this.db) {
      try {
        await insert(this.db, "users", userToRow(user));
        await insert(this.db, "user_credentials", { user_id: user.id, hash, salt });
      } catch (err) {
        console.warn("[AuthProvider] Failed to persist user to DB:", err);
      }
    }

    const token = this.jwtManager.sign({ sub: user.id, role: user.role, email: user.email });
    return { success: true, user, token };
  }

  async authenticate(email: string, password: string): Promise<AuthResult> {
    await this.ready;
    let user = Array.from(this.users.values()).find((u) => u.email === email);

    if (!user && this.db) {
      try {
        const userRows = await findAll<UserRow>(this.db, "users", { filters: { email } });
        if (userRows.length > 0) {
          user = rowToUser(userRows[0]);
          this.users.set(user.id, user);
          const credRows = await findAll<CredentialRow>(this.db, "user_credentials", { filters: { user_id: user.id } });
          if (credRows.length > 0) {
            this.passwords.set(user.id, { hash: credRows[0].hash, salt: credRows[0].salt });
          }
        }
      } catch (err) {
        console.warn("[AuthProvider] Failed to query user from DB:", err);
      }
    }

    if (!user) return { success: false, error: "Invalid credentials" };

    const stored = this.passwords.get(user.id);
    if (!stored) return { success: false, error: "Invalid credentials" };

    if (!Encryption.verifyPassword(password, stored.hash, stored.salt)) {
      return { success: false, error: "Invalid credentials" };
    }

    if (user.mfaEnabled) {
      return {
        success: true,
        user,
        requiresMfa: true,
        mfaChallenge: "totp",
      };
    }

    const token = this.jwtManager.sign({ sub: user.id, role: user.role, email: user.email });
    return { success: true, user, token };
  }

  async verifyMFA(userId: string, code: string): Promise<AuthResult> {
    await this.ready;
    const user = this.users.get(userId);
    if (!user) return { success: false, error: "User not found" };
    if (!user.mfaEnabled || !user.mfaSecret) return { success: false, error: "MFA not enabled" };

    const valid = this.totpManager.verifyCode(user.mfaSecret, code);
    if (!valid) return { success: false, error: "Invalid MFA code" };

    const token = this.jwtManager.sign({ sub: user.id, role: user.role, email: user.email });
    return { success: true, user, token };
  }

  async validateToken(token: string): Promise<User | null> {
    const payload = this.jwtManager.verify(token);
    if (!payload) return null;
    return this.users.get(payload.sub) || null;
  }

  async enableMFA(userId: string): Promise<{ secret: string; uri: string } | null> {
    await this.ready;
    const user = this.users.get(userId);
    if (!user) return null;

    const secret = this.totpManager.generateSecret();
    user.mfaSecret = secret;
    user.mfaEnabled = true;

    if (this.db) {
      try {
        await this.db
          .from("users")
          .update({ mfa_enabled: true, mfa_secret: secret })
          .eq("id", userId);
      } catch (err) {
        console.warn("[AuthProvider] Failed to update MFA in DB:", err);
      }
    }

    const uri = this.totpManager.generateProvisionUri(secret, user.email);
    return { secret, uri };
  }

  async disableMFA(userId: string): Promise<boolean> {
    await this.ready;
    const user = this.users.get(userId);
    if (!user) return false;
    user.mfaEnabled = false;
    user.mfaSecret = undefined;

    if (this.db) {
      try {
        await this.db
          .from("users")
          .update({ mfa_enabled: false, mfa_secret: null })
          .eq("id", userId);
      } catch (err) {
        console.warn("[AuthProvider] Failed to update MFA in DB:", err);
      }
    }

    return true;
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  listUsers(): User[] {
    return Array.from(this.users.values());
  }

  updateUser(userId: string, updates: Partial<Pick<User, "displayName" | "role">>): User | undefined {
    const user = this.users.get(userId);
    if (!user) return undefined;
    Object.assign(user, updates);

    if (this.db) {
      try {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
        if (updates.role !== undefined) dbUpdates.role = updates.role;
        this.db.from("users").update(dbUpdates).eq("id", userId).then(() => {}).catch((err: Error) => {
          console.warn("[AuthProvider] Failed to update user in DB:", err);
        });
      } catch (err) {
        console.warn("[AuthProvider] Failed to update user in DB:", err);
      }
    }

    return user;
  }

  deleteUser(userId: string): boolean {
    this.passwords.delete(userId);
    const result = this.users.delete(userId);

    if (this.db) {
      try {
        this.db.from("user_credentials").delete().eq("user_id", userId).then(() => {}).catch((err: Error) => {
          console.warn("[AuthProvider] Failed to delete credentials from DB:", err);
        });
        this.db.from("users").delete().eq("id", userId).then(() => {}).catch((err: Error) => {
          console.warn("[AuthProvider] Failed to delete user from DB:", err);
        });
      } catch (err) {
        console.warn("[AuthProvider] Failed to delete user from DB:", err);
      }
    }

    return result;
  }
}

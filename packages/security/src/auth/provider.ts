import { Encryption } from "../encryption/index";
import { JWTManager } from "../jwt";
import { TOTPManager } from "../mfa/totp";
import { WebAuthnManager } from "../webauthn/index";
import { OAuth2Manager } from "../oauth2/index";

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

export class AuthProvider {
  private users: Map<string, User> = new Map();
  private passwords: Map<string, { hash: string; salt: string }> = new Map();
  private jwtManager: JWTManager;
  private totpManager: TOTPManager;
  private webauthnManager: WebAuthnManager;
  private oauth2Manager: OAuth2Manager;

  constructor(jwtSecret?: string) {
    this.jwtManager = new JWTManager(jwtSecret);
    this.totpManager = new TOTPManager();
    this.webauthnManager = new WebAuthnManager();
    this.oauth2Manager = new OAuth2Manager();
  }

  getJWTManager(): JWTManager { return this.jwtManager; }
  getTOTPManager(): TOTPManager { return this.totpManager; }
  getWebAuthnManager(): WebAuthnManager { return this.webauthnManager; }
  getOAuth2Manager(): OAuth2Manager { return this.oauth2Manager; }

  async register(email: string, password: string, displayName?: string): Promise<AuthResult> {
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

    const token = this.jwtManager.sign({ sub: user.id, role: user.role, email: user.email });
    return { success: true, user, token };
  }

  async authenticate(email: string, password: string): Promise<AuthResult> {
    const user = Array.from(this.users.values()).find((u) => u.email === email);
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
    const user = this.users.get(userId);
    if (!user) return null;

    const secret = this.totpManager.generateSecret();
    user.mfaSecret = secret;
    user.mfaEnabled = true;

    const uri = this.totpManager.generateProvisionUri(secret, user.email);
    return { secret, uri };
  }

  async disableMFA(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
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
    return user;
  }

  deleteUser(userId: string): boolean {
    this.passwords.delete(userId);
    return this.users.delete(userId);
  }
}

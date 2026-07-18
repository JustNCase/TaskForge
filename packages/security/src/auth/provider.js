import { Encryption } from "../encryption/index";
import { JWTManager } from "../jwt";
import { TOTPManager } from "../mfa/totp";
import { WebAuthnManager } from "../webauthn/index";
import { OAuth2Manager } from "../oauth2/index";
export class AuthProvider {
    users = new Map();
    passwords = new Map();
    jwtManager;
    totpManager;
    webauthnManager;
    oauth2Manager;
    constructor(jwtSecret) {
        this.jwtManager = new JWTManager(jwtSecret);
        this.totpManager = new TOTPManager();
        this.webauthnManager = new WebAuthnManager();
        this.oauth2Manager = new OAuth2Manager();
    }
    getJWTManager() { return this.jwtManager; }
    getTOTPManager() { return this.totpManager; }
    getWebAuthnManager() { return this.webauthnManager; }
    getOAuth2Manager() { return this.oauth2Manager; }
    async register(email, password, displayName) {
        if (this.users.has(email)) {
            return { success: false, error: "User already exists" };
        }
        const { hash, salt } = Encryption.hashPassword(password);
        const user = {
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
    async authenticate(email, password) {
        const user = Array.from(this.users.values()).find((u) => u.email === email);
        if (!user)
            return { success: false, error: "Invalid credentials" };
        const stored = this.passwords.get(user.id);
        if (!stored)
            return { success: false, error: "Invalid credentials" };
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
    async verifyMFA(userId, code) {
        const user = this.users.get(userId);
        if (!user)
            return { success: false, error: "User not found" };
        if (!user.mfaEnabled || !user.mfaSecret)
            return { success: false, error: "MFA not enabled" };
        const valid = this.totpManager.verifyCode(user.mfaSecret, code);
        if (!valid)
            return { success: false, error: "Invalid MFA code" };
        const token = this.jwtManager.sign({ sub: user.id, role: user.role, email: user.email });
        return { success: true, user, token };
    }
    async validateToken(token) {
        const payload = this.jwtManager.verify(token);
        if (!payload)
            return null;
        return this.users.get(payload.sub) || null;
    }
    async enableMFA(userId) {
        const user = this.users.get(userId);
        if (!user)
            return null;
        const secret = this.totpManager.generateSecret();
        user.mfaSecret = secret;
        user.mfaEnabled = true;
        const uri = this.totpManager.generateProvisionUri(secret, user.email);
        return { secret, uri };
    }
    async disableMFA(userId) {
        const user = this.users.get(userId);
        if (!user)
            return false;
        user.mfaEnabled = false;
        user.mfaSecret = undefined;
        return true;
    }
    getUser(userId) {
        return this.users.get(userId);
    }
    listUsers() {
        return Array.from(this.users.values());
    }
    updateUser(userId, updates) {
        const user = this.users.get(userId);
        if (!user)
            return undefined;
        Object.assign(user, updates);
        return user;
    }
    deleteUser(userId) {
        this.passwords.delete(userId);
        return this.users.delete(userId);
    }
}
//# sourceMappingURL=provider.js.map
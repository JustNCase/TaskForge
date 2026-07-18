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
export declare class AuthProvider {
    private users;
    private passwords;
    private jwtManager;
    private totpManager;
    private webauthnManager;
    private oauth2Manager;
    constructor(jwtSecret?: string);
    getJWTManager(): JWTManager;
    getTOTPManager(): TOTPManager;
    getWebAuthnManager(): WebAuthnManager;
    getOAuth2Manager(): OAuth2Manager;
    register(email: string, password: string, displayName?: string): Promise<AuthResult>;
    authenticate(email: string, password: string): Promise<AuthResult>;
    verifyMFA(userId: string, code: string): Promise<AuthResult>;
    validateToken(token: string): Promise<User | null>;
    enableMFA(userId: string): Promise<{
        secret: string;
        uri: string;
    } | null>;
    disableMFA(userId: string): Promise<boolean>;
    getUser(userId: string): User | undefined;
    listUsers(): User[];
    updateUser(userId: string, updates: Partial<Pick<User, "displayName" | "role">>): User | undefined;
    deleteUser(userId: string): boolean;
}
//# sourceMappingURL=provider.d.ts.map
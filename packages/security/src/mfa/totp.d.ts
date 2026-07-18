export interface TOTPConfig {
    secret: string;
    algorithm: "sha1" | "sha256" | "sha512";
    digits: number;
    interval: number;
}
export declare class TOTPManager {
    generateSecret(): string;
    generateCode(secret: string, timestamp?: number): string;
    verifyCode(secret: string, code: string, timestamp?: number): boolean;
    generateProvisionUri(secret: string, accountName: string, issuer?: string): string;
}
//# sourceMappingURL=totp.d.ts.map
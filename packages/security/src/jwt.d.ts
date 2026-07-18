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
export declare class JWTManager {
    private secret;
    private defaultExpiry;
    constructor(secret?: string, defaultExpiryMs?: number);
    sign(payload: Omit<JWTPayload, "iat" | "exp">, options?: JWTSignOptions): string;
    verify(token: string): JWTPayload | null;
    decode(token: string): JWTPayload | null;
    refresh(token: string): string | null;
    private signature;
    private generateJTI;
    private base64UrlEncode;
    private base64UrlDecode;
}
//# sourceMappingURL=jwt.d.ts.map
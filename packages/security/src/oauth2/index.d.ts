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
export declare class OAuth2Manager {
    private clients;
    private authorizations;
    private tokens;
    private tokenExpiryMs;
    private refreshExpiryMs;
    registerClient(client: Omit<OAuth2Client, "clientId" | "clientSecret">): OAuth2Client;
    getClient(clientId: string): OAuth2Client | undefined;
    validateClient(clientId: string, clientSecret: string): boolean;
    createAuthorizationCode(clientId: string, userId: string, redirectUri: string, scope: string): string;
    exchangeAuthorizationCode(code: string, clientId: string, clientSecret: string, redirectUri: string): OAuth2Token | null;
    exchangeRefreshToken(refreshToken: string, clientId: string, clientSecret: string): OAuth2Token | null;
    validateToken(accessToken: string): OAuth2Token | null;
    revokeToken(accessToken: string): boolean;
    private createToken;
}
//# sourceMappingURL=index.d.ts.map
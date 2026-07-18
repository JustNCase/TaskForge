export interface WebAuthnCredential {
    id: string;
    publicKey: string;
    counter: number;
    deviceName: string;
    transports: string[];
    createdAt: string;
}
export interface RegistrationChallenge {
    challenge: string;
    rp: {
        name: string;
        id: string;
    };
    user: {
        id: string;
        name: string;
        displayName: string;
    };
    pubKeyCredParams: {
        type: "public-key";
        alg: number;
    }[];
    timeout: number;
    attestation: "none" | "direct" | "indirect";
    excludeCredentials: {
        id: string;
        type: "public-key";
        transports: string[];
    }[];
}
export interface AuthenticationChallenge {
    challenge: string;
    timeout: number;
    rpId: string;
    allowCredentials: {
        id: string;
        type: "public-key";
        transports: string[];
    }[];
    userVerification: "required" | "preferred" | "discouraged";
}
export declare class WebAuthnManager {
    private credentials;
    private challenges;
    private rpName;
    private rpId;
    private origin;
    constructor(rpName?: string, rpId?: string, origin?: string);
    generateChallenge(): string;
    createRegistrationChallenge(userId: string, userName: string, userDisplayName: string): RegistrationChallenge;
    createAuthenticationChallenge(userId: string): AuthenticationChallenge | null;
    verifyRegistration(userId: string, credential: {
        id: string;
        response: {
            publicKey: string;
        };
        transports?: string[];
    }, deviceName?: string): boolean;
    verifyAuthentication(userId: string, credential: {
        id: string;
        response: {
            signature: string;
        };
    }): boolean;
    getCredentials(userId: string): WebAuthnCredential[];
    removeCredential(userId: string, credentialId: string): boolean;
}
//# sourceMappingURL=index.d.ts.map
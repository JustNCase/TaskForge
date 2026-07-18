import { randomBytes } from "crypto";
export class WebAuthnManager {
    credentials = new Map();
    challenges = new Map();
    rpName;
    rpId;
    origin;
    constructor(rpName = "Genesis-OS", rpId = "localhost", origin = "http://localhost:3000") {
        this.rpName = rpName;
        this.rpId = rpId;
        this.origin = origin;
    }
    generateChallenge() {
        return randomBytes(32).toString("base64url");
    }
    createRegistrationChallenge(userId, userName, userDisplayName) {
        const challenge = this.generateChallenge();
        this.challenges.set(userId, challenge);
        const existingCreds = this.credentials.get(userId) || [];
        return {
            challenge,
            rp: { name: this.rpName, id: this.rpId },
            user: { id: Buffer.from(userId).toString("base64url"), name: userName, displayName: userDisplayName },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }],
            timeout: 60000,
            attestation: "none",
            excludeCredentials: existingCreds.map((c) => ({
                id: c.id,
                type: "public-key",
                transports: c.transports,
            })),
        };
    }
    createAuthenticationChallenge(userId) {
        const userCreds = this.credentials.get(userId);
        if (!userCreds || userCreds.length === 0)
            return null;
        const challenge = this.generateChallenge();
        this.challenges.set(userId, challenge);
        return {
            challenge,
            timeout: 60000,
            rpId: this.rpId,
            allowCredentials: userCreds.map((c) => ({
                id: c.id,
                type: "public-key",
                transports: c.transports,
            })),
            userVerification: "preferred",
        };
    }
    verifyRegistration(userId, credential, deviceName) {
        const challenge = this.challenges.get(userId);
        if (!challenge)
            return false;
        this.challenges.delete(userId);
        const newCred = {
            id: credential.id,
            publicKey: credential.response.publicKey,
            counter: 0,
            deviceName: deviceName || "Unknown Device",
            transports: credential.transports || ["internal"],
            createdAt: new Date().toISOString(),
        };
        const existing = this.credentials.get(userId) || [];
        existing.push(newCred);
        this.credentials.set(userId, existing);
        return true;
    }
    verifyAuthentication(userId, credential) {
        const challenge = this.challenges.get(userId);
        if (!challenge)
            return false;
        this.challenges.delete(userId);
        const userCreds = this.credentials.get(userId);
        if (!userCreds)
            return false;
        const matched = userCreds.find((c) => c.id === credential.id);
        if (!matched)
            return false;
        matched.counter++;
        return true;
    }
    getCredentials(userId) {
        return this.credentials.get(userId) || [];
    }
    removeCredential(userId, credentialId) {
        const userCreds = this.credentials.get(userId);
        if (!userCreds)
            return false;
        const filtered = userCreds.filter((c) => c.id !== credentialId);
        this.credentials.set(userId, filtered);
        return filtered.length < userCreds.length;
    }
}
//# sourceMappingURL=index.js.map
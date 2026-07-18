import { randomBytes, createHash } from "crypto";

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
  rp: { name: string; id: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: { type: "public-key"; alg: number }[];
  timeout: number;
  attestation: "none" | "direct" | "indirect";
  excludeCredentials: { id: string; type: "public-key"; transports: string[] }[];
}

export interface AuthenticationChallenge {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials: { id: string; type: "public-key"; transports: string[] }[];
  userVerification: "required" | "preferred" | "discouraged";
}

export class WebAuthnManager {
  private credentials: Map<string, WebAuthnCredential[]> = new Map();
  private challenges: Map<string, string> = new Map();
  private rpName: string;
  private rpId: string;
  private origin: string;

  constructor(rpName = "Genesis-OS", rpId = "localhost", origin = "http://localhost:3000") {
    this.rpName = rpName;
    this.rpId = rpId;
    this.origin = origin;
  }

  generateChallenge(): string {
    return randomBytes(32).toString("base64url");
  }

  createRegistrationChallenge(userId: string, userName: string, userDisplayName: string): RegistrationChallenge {
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
        type: "public-key" as const,
        transports: c.transports as string[],
      })),
    };
  }

  createAuthenticationChallenge(userId: string): AuthenticationChallenge | null {
    const userCreds = this.credentials.get(userId);
    if (!userCreds || userCreds.length === 0) return null;

    const challenge = this.generateChallenge();
    this.challenges.set(userId, challenge);

    return {
      challenge,
      timeout: 60000,
      rpId: this.rpId,
      allowCredentials: userCreds.map((c) => ({
        id: c.id,
        type: "public-key" as const,
        transports: c.transports,
      })),
      userVerification: "preferred",
    };
  }

  verifyRegistration(userId: string, credential: { id: string; response: { publicKey: string }; transports?: string[] }, deviceName?: string): boolean {
    const challenge = this.challenges.get(userId);
    if (!challenge) return false;
    this.challenges.delete(userId);

    const newCred: WebAuthnCredential = {
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

  verifyAuthentication(userId: string, credential: { id: string; response: { signature: string } }): boolean {
    const challenge = this.challenges.get(userId);
    if (!challenge) return false;
    this.challenges.delete(userId);

    const userCreds = this.credentials.get(userId);
    if (!userCreds) return false;

    const matched = userCreds.find((c) => c.id === credential.id);
    if (!matched) return false;

    matched.counter++;
    return true;
  }

  getCredentials(userId: string): WebAuthnCredential[] {
    return this.credentials.get(userId) || [];
  }

  removeCredential(userId: string, credentialId: string): boolean {
    const userCreds = this.credentials.get(userId);
    if (!userCreds) return false;
    const filtered = userCreds.filter((c) => c.id !== credentialId);
    this.credentials.set(userId, filtered);
    return filtered.length < userCreds.length;
  }
}

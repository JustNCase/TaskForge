import { randomBytes, createHash } from "crypto";
import { getServerClient, findAll, insert, remove } from "@taskforge/database";

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

interface CredentialRow {
  id: string;
  user_id: string;
  public_key: string;
  counter: number;
  device_name: string;
  transports: string[] | string;
  created_at: string;
}

interface ChallengeRow {
  user_id: string;
  challenge: string;
  type: string;
  created_at: string;
}

function rowToCredential(row: CredentialRow): WebAuthnCredential {
  return {
    id: row.id,
    publicKey: row.public_key,
    counter: row.counter,
    deviceName: row.device_name,
    transports: typeof row.transports === "string" ? JSON.parse(row.transports) : row.transports,
    createdAt: row.created_at,
  };
}

function credentialToRow(cred: WebAuthnCredential, userId: string): Record<string, unknown> {
  return {
    id: cred.id,
    user_id: userId,
    public_key: cred.publicKey,
    counter: cred.counter,
    device_name: cred.deviceName,
    transports: JSON.stringify(cred.transports),
    created_at: cred.createdAt,
  };
}

export class WebAuthnManager {
  private credentials: Map<string, WebAuthnCredential[]> = new Map();
  private challenges: Map<string, string> = new Map();
  private rpName: string;
  private rpId: string;
  private origin: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any | null = null;
  private ready: Promise<void>;

  constructor(rpName = "Genesis-OS", rpId = "localhost", origin = "http://localhost:3000", persist?: boolean) {
    this.rpName = rpName;
    this.rpId = rpId;
    this.origin = origin;

    if (persist) {
      try {
        this.db = getServerClient();
      } catch (err) {
        console.warn("[WebAuthnManager] Failed to get Supabase client, falling back to in-memory:", err);
        this.db = null;
      }
    }

    this.ready = this.db ? this.loadFromDb() : Promise.resolve();
  }

  private async loadFromDb(): Promise<void> {
    try {
      const credRows = await findAll<CredentialRow>(this.db, "webauthn_credentials");
      for (const row of credRows) {
        const cred = rowToCredential(row);
        if (!this.credentials.has(row.user_id)) {
          this.credentials.set(row.user_id, []);
        }
        this.credentials.get(row.user_id)!.push(cred);
      }
    } catch (err) {
      console.warn("[WebAuthnManager] Failed to load credentials from DB:", err);
    }
  }

  generateChallenge(): string {
    return randomBytes(32).toString("base64url");
  }

  createRegistrationChallenge(userId: string, userName: string, userDisplayName: string): RegistrationChallenge {
    const challenge = this.generateChallenge();
    this.challenges.set(userId, challenge);

    if (this.db) {
      try {
        this.db.from("webauthn_challenges").insert({
          user_id: userId,
          challenge,
          type: "registration",
          created_at: new Date().toISOString(),
        }).then(() => {}).catch((err: Error) => {
          console.warn("[WebAuthnManager] Failed to persist challenge to DB:", err);
        });
      } catch (err) {
        console.warn("[WebAuthnManager] Failed to persist challenge to DB:", err);
      }
    }

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

    if (this.db) {
      try {
        this.db.from("webauthn_challenges").insert({
          user_id: userId,
          challenge,
          type: "authentication",
          created_at: new Date().toISOString(),
        }).then(() => {}).catch((err: Error) => {
          console.warn("[WebAuthnManager] Failed to persist challenge to DB:", err);
        });
      } catch (err) {
        console.warn("[WebAuthnManager] Failed to persist challenge to DB:", err);
      }
    }

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

  async verifyRegistration(userId: string, credential: { id: string; response: { publicKey: string }; transports?: string[] }, deviceName?: string): Promise<boolean> {
    await this.ready;
    const challenge = this.challenges.get(userId);
    if (!challenge) return false;
    this.challenges.delete(userId);

    if (this.db) {
      try {
        await this.db.from("webauthn_challenges").delete().eq("user_id", userId).eq("challenge", challenge);
      } catch (err) {
        console.warn("[WebAuthnManager] Failed to delete challenge from DB:", err);
      }
    }

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

    if (this.db) {
      try {
        await insert(this.db, "webauthn_credentials", credentialToRow(newCred, userId));
      } catch (err) {
        console.warn("[WebAuthnManager] Failed to persist credential to DB:", err);
      }
    }

    return true;
  }

  async verifyAuthentication(userId: string, credential: { id: string; response: { signature: string } }): Promise<boolean> {
    await this.ready;
    const challenge = this.challenges.get(userId);
    if (!challenge) return false;
    this.challenges.delete(userId);

    if (this.db) {
      try {
        await this.db.from("webauthn_challenges").delete().eq("user_id", userId).eq("challenge", challenge);
      } catch (err) {
        console.warn("[WebAuthnManager] Failed to delete challenge from DB:", err);
      }
    }

    const userCreds = this.credentials.get(userId);
    if (!userCreds) return false;

    const matched = userCreds.find((c) => c.id === credential.id);
    if (!matched) return false;

    matched.counter++;

    if (this.db) {
      try {
        await this.db
          .from("webauthn_credentials")
          .update({ counter: matched.counter })
          .eq("id", credential.id);
      } catch (err) {
        console.warn("[WebAuthnManager] Failed to update counter in DB:", err);
      }
    }

    return true;
  }

  async getCredentials(userId: string): Promise<WebAuthnCredential[]> {
    await this.ready;
    const cached = this.credentials.get(userId) || [];
    if (cached.length > 0 || !this.db) return cached;

    try {
      const rows = await findAll<CredentialRow>(this.db, "webauthn_credentials", { filters: { user_id: userId } });
      const creds = rows.map(rowToCredential);
      this.credentials.set(userId, creds);
      return creds;
    } catch (err) {
      console.warn("[WebAuthnManager] Failed to load credentials from DB:", err);
      return cached;
    }
  }

  async removeCredential(userId: string, credentialId: string): Promise<boolean> {
    await this.ready;
    const userCreds = this.credentials.get(userId);
    if (!userCreds) return false;
    const filtered = userCreds.filter((c) => c.id !== credentialId);
    this.credentials.set(userId, filtered);

    if (this.db) {
      try {
        await remove(this.db, "webauthn_credentials", credentialId);
      } catch (err) {
        console.warn("[WebAuthnManager] Failed to delete credential from DB:", err);
      }
    }

    return filtered.length < userCreds.length;
  }
}

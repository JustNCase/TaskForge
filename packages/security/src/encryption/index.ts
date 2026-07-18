import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const AES_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
  salt?: string;
}

export class Encryption {
  static hash(data: string): string {
    return createHash("sha256").update(data).digest("hex");
  }

  static randomToken(length: number = 32): string {
    return randomBytes(length).toString("hex");
  }

  static deriveKey(passphrase: string, salt?: string): { key: Buffer; salt: string } {
    const useSalt = salt || randomBytes(SALT_LENGTH).toString("hex");
    const key = scryptSync(passphrase, useSalt, KEY_LENGTH);
    return { key, salt: useSalt };
  }

  static encrypt(plaintext: string, passphrase: string): EncryptedData {
    const { key, salt } = this.deriveKey(passphrase);
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(AES_ALGORITHM, key, iv);

    let ciphertext = cipher.update(plaintext, "utf8", "hex");
    ciphertext += cipher.final("hex");
    const tag = cipher.getAuthTag().toString("hex");

    return { ciphertext, iv: iv.toString("hex"), tag, salt };
  }

  static decrypt(data: EncryptedData, passphrase: string): string {
    const { key } = this.deriveKey(passphrase, data.salt);
    const iv = Buffer.from(data.iv, "hex");
    const tag = Buffer.from(data.tag, "hex");
    const decipher = createDecipheriv(AES_ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let plaintext = decipher.update(data.ciphertext, "hex", "utf8");
    plaintext += decipher.final("utf8");
    return plaintext;
  }

  static hashPassword(password: string): { hash: string; salt: string } {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return { hash, salt };
  }

  static verifyPassword(password: string, hash: string, salt: string): boolean {
    const derived = scryptSync(password, salt, 64);
    const stored = Buffer.from(hash, "hex");
    if (derived.length !== stored.length) return false;
    return timingSafeEqual(derived, stored);
  }

  static generateApiKey(): { key: string; prefix: string; hash: string } {
    const prefix = `gen_${randomBytes(4).toString("hex")}`;
    const secret = randomBytes(32).toString("hex");
    const key = `${prefix}_${secret}`;
    const hash = this.hash(key);
    return { key, prefix, hash };
  }
}

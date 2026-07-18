import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
const AES_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
export class Encryption {
    static hash(data) {
        return createHash("sha256").update(data).digest("hex");
    }
    static randomToken(length = 32) {
        return randomBytes(length).toString("hex");
    }
    static deriveKey(passphrase, salt) {
        const useSalt = salt || randomBytes(SALT_LENGTH).toString("hex");
        const key = scryptSync(passphrase, useSalt, KEY_LENGTH);
        return { key, salt: useSalt };
    }
    static encrypt(plaintext, passphrase) {
        const { key, salt } = this.deriveKey(passphrase);
        const iv = randomBytes(IV_LENGTH);
        const cipher = createCipheriv(AES_ALGORITHM, key, iv);
        let ciphertext = cipher.update(plaintext, "utf8", "hex");
        ciphertext += cipher.final("hex");
        const tag = cipher.getAuthTag().toString("hex");
        return { ciphertext, iv: iv.toString("hex"), tag, salt };
    }
    static decrypt(data, passphrase) {
        const { key } = this.deriveKey(passphrase, data.salt);
        const iv = Buffer.from(data.iv, "hex");
        const tag = Buffer.from(data.tag, "hex");
        const decipher = createDecipheriv(AES_ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        let plaintext = decipher.update(data.ciphertext, "hex", "utf8");
        plaintext += decipher.final("utf8");
        return plaintext;
    }
    static hashPassword(password) {
        const salt = randomBytes(16).toString("hex");
        const hash = scryptSync(password, salt, 64).toString("hex");
        return { hash, salt };
    }
    static verifyPassword(password, hash, salt) {
        const derived = scryptSync(password, salt, 64);
        const stored = Buffer.from(hash, "hex");
        if (derived.length !== stored.length)
            return false;
        return timingSafeEqual(derived, stored);
    }
    static generateApiKey() {
        const prefix = `gen_${randomBytes(4).toString("hex")}`;
        const secret = randomBytes(32).toString("hex");
        const key = `${prefix}_${secret}`;
        const hash = this.hash(key);
        return { key, prefix, hash };
    }
}
//# sourceMappingURL=index.js.map
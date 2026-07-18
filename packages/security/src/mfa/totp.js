import { createHmac, randomBytes } from "crypto";
const TOTP_INTERVAL = 30;
const TOTP_DIGITS = 6;
const WINDOW_SIZE = 1;
export class TOTPManager {
    generateSecret() {
        return randomBytes(20).toString("hex");
    }
    generateCode(secret, timestamp) {
        const time = Math.floor((timestamp || Date.now()) / 1000 / TOTP_INTERVAL);
        const timeBuffer = Buffer.alloc(8);
        timeBuffer.writeBigInt64BE(BigInt(time));
        const hmac = createHmac("sha1", Buffer.from(secret, "hex"));
        hmac.update(timeBuffer);
        const digest = hmac.digest();
        const offset = digest[digest.length - 1] & 0xf;
        const binary = ((digest[offset] & 0x7f) << 24) |
            ((digest[offset + 1] & 0xff) << 16) |
            ((digest[offset + 2] & 0xff) << 8) |
            (digest[offset + 3] & 0xff);
        const code = binary % Math.pow(10, TOTP_DIGITS);
        return code.toString().padStart(TOTP_DIGITS, "0");
    }
    verifyCode(secret, code, timestamp) {
        const time = timestamp || Date.now();
        for (let i = -WINDOW_SIZE; i <= WINDOW_SIZE; i++) {
            const expectedCode = this.generateCode(secret, time + i * TOTP_INTERVAL * 1000);
            if (expectedCode === code)
                return true;
        }
        return false;
    }
    generateProvisionUri(secret, accountName, issuer = "Genesis-OS") {
        const encodedIssuer = encodeURIComponent(issuer);
        const encodedAccount = encodeURIComponent(accountName);
        return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${Buffer.from(secret, "hex").toString("base64")}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_INTERVAL}`;
    }
}
//# sourceMappingURL=totp.js.map
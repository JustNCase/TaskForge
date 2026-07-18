export interface EncryptedData {
    ciphertext: string;
    iv: string;
    tag: string;
    salt?: string;
}
export declare class Encryption {
    static hash(data: string): string;
    static randomToken(length?: number): string;
    static deriveKey(passphrase: string, salt?: string): {
        key: Buffer;
        salt: string;
    };
    static encrypt(plaintext: string, passphrase: string): EncryptedData;
    static decrypt(data: EncryptedData, passphrase: string): string;
    static hashPassword(password: string): {
        hash: string;
        salt: string;
    };
    static verifyPassword(password: string, hash: string, salt: string): boolean;
    static generateApiKey(): {
        key: string;
        prefix: string;
        hash: string;
    };
}
//# sourceMappingURL=index.d.ts.map
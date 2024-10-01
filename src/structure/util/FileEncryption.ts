import * as crypto from 'node:crypto';

const cryptoAlgorithm = process.env.crypto_algorithm || "aes-256-cbc";
const cryptoPass = process.env.crypto_password || crypto.randomInt(1000000000).toString();

export class FileEncryption {

    private static readonly SALT_LENGTH = 16;
    private static readonly IV_LENGTH = 16;
    private static readonly KEY_SIZE = 256;
    private static readonly INTERATION_COUNT = 65536;

    static encrypt(data: string, algorithm = cryptoAlgorithm, password = cryptoPass): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const salt = crypto.randomBytes(FileEncryption.SALT_LENGTH);
                const key = this.deriveKey(password, salt);
                const iv = crypto.randomBytes(FileEncryption.IV_LENGTH);

                const cipher = crypto.createCipheriv(algorithm, key, iv);

                let encrypted = cipher.update(data, 'utf8', 'base64');
                encrypted += cipher.final('base64');

                const resultBuffer = Buffer.concat([salt, iv, Buffer.from(encrypted)]);
                resolve(resultBuffer.toString('base64'));
            } catch (e) {
                reject(e);
            }
        });
    }

    static decrypt(data: string, algorithm = cryptoAlgorithm, password = cryptoPass): Promise<string> {
        const encryptedBuffer = Buffer.from(data, 'base64');

        const salt = encryptedBuffer.subarray(0, FileEncryption.SALT_LENGTH);
        const iv = encryptedBuffer.subarray(FileEncryption.SALT_LENGTH, FileEncryption.SALT_LENGTH + FileEncryption.IV_LENGTH);
        const encrypted = encryptedBuffer.subarray(FileEncryption.SALT_LENGTH + FileEncryption.IV_LENGTH);

        const key = this.deriveKey(password, salt);

        return new Promise((resolve, reject) => {
            try {
                const decipher = crypto.createDecipheriv(algorithm, key, iv);

                let decrypted = decipher.update(encrypted.toString('utf8'), 'base64', 'utf8');
                decrypted += decipher.final('utf8');

                resolve(decrypted);
            } catch (e) {
                reject(e);
            }
        });
    }

    private static deriveKey(password: string, salt: Buffer): Buffer {
        return crypto.pbkdf2Sync(password, salt, FileEncryption.INTERATION_COUNT, FileEncryption.KEY_SIZE / 8, 'sha512');
    }
}
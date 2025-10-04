"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStripeInstance = exports.decrypt = exports.encrypt = void 0;
const crypto_1 = __importDefault(require("crypto"));
const stripe_1 = __importDefault(require("stripe"));
const config_1 = __importDefault(require("../config"));
const ALGORITHM = 'aes-256-cbc';
const getEncryptionKey = () => {
    const key = process.env.ENCRYPTION_KEY || config_1.default.encryption_key;
    if (!key) {
        throw new Error('ENCRYPTION_KEY is not configured in environment variables');
    }
    return crypto_1.default.createHash('sha256').update(key).digest();
};
const encrypt = (text) => {
    try {
        const key = getEncryptionKey();
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    }
    catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
};
exports.encrypt = encrypt;
const decrypt = (encryptedText) => {
    try {
        const key = getEncryptionKey();
        const parts = encryptedText.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted data format');
        }
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedData = parts[1];
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
};
exports.decrypt = decrypt;
const createStripeInstance = (encryptedSecretKey) => {
    const decryptedKey = (0, exports.decrypt)(encryptedSecretKey);
    return new stripe_1.default(decryptedKey);
};
exports.createStripeInstance = createStripeInstance;

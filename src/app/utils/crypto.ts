import crypto from 'crypto';
import Stripe from 'stripe';
import config from '../config';

// Algorithm for encryption
const ALGORITHM = 'aes-256-cbc';

// Get encryption key from environment (should be 32 bytes)
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY || config.encryption_key;

  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY is not configured in environment variables',
    );
  }

  // Ensure the key is exactly 32 bytes for AES-256
  return crypto.createHash('sha256').update(key).digest();
};

export const encrypt = (text: string): string => {
  try {
    const key = getEncryptionKey();

    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return iv and encrypted data separated by :
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

export const decrypt = (encryptedText: string): string => {
  try {
    const key = getEncryptionKey();

    // Split iv and encrypted data
    const parts = encryptedText.split(':');

    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // Decrypt the data
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

export const createStripeInstance = (encryptedSecretKey: string): Stripe => {
  const decryptedKey = decrypt(encryptedSecretKey);
  return new Stripe(decryptedKey);
};

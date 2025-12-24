// ===========================================
// FIELD-LEVEL ENCRYPTION UTILITY
// AES-256-GCM encryption for sensitive database fields
// ===========================================

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { logger } from './logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Get encryption key from environment
// IMPORTANT: This should be a 64-character hex string (32 bytes)
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY;

// Derive a proper key from the environment variable
let derivedKey: Buffer | null = null;

function getDerivedKey(): Buffer | null {
    if (derivedKey) return derivedKey;

    if (!ENCRYPTION_KEY) {
        return null;
    }

    try {
        // If key is hex-encoded (64 chars = 32 bytes)
        if (ENCRYPTION_KEY.length === 64 && /^[0-9a-fA-F]+$/.test(ENCRYPTION_KEY)) {
            derivedKey = Buffer.from(ENCRYPTION_KEY, 'hex');
        } else {
            // Derive key using scrypt for any other format
            const salt = Buffer.from('rapid-apollo-salt-v1', 'utf8');
            derivedKey = scryptSync(ENCRYPTION_KEY, salt, 32);
        }
        return derivedKey;
    } catch (error) {
        logger.error('Failed to derive encryption key', error as Error);
        return null;
    }
}

/**
 * Check if encryption is available
 */
export function isEncryptionEnabled(): boolean {
    return getDerivedKey() !== null;
}

/**
 * Encrypt a string value
 * Returns format: iv:ciphertext:authTag (all hex encoded)
 * Returns original value if encryption is not enabled
 */
export function encrypt(plaintext: string): string {
    const key = getDerivedKey();

    if (!key) {
        // Encryption not enabled, return plaintext with marker
        return plaintext;
    }

    if (!plaintext || typeof plaintext !== 'string') {
        return plaintext;
    }

    try {
        const iv = randomBytes(IV_LENGTH);
        const cipher = createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Format: ENC:v1:iv:ciphertext:authTag
        return `ENC:v1:${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
    } catch (error) {
        logger.error('Encryption failed, storing plaintext', error as Error);
        return plaintext;
    }
}

/**
 * Decrypt a string value
 * Expects format: ENC:v1:iv:ciphertext:authTag (all hex encoded)
 * Returns original value if not encrypted or decryption fails
 */
export function decrypt(encryptedValue: string): string {
    const key = getDerivedKey();

    if (!encryptedValue || typeof encryptedValue !== 'string') {
        return encryptedValue;
    }

    // Check if this is an encrypted value
    if (!encryptedValue.startsWith('ENC:v1:')) {
        // Not encrypted, return as-is
        return encryptedValue;
    }

    if (!key) {
        // Encryption key not available, can't decrypt
        logger.warn('Cannot decrypt: encryption key not configured');
        return '[ENCRYPTED - KEY UNAVAILABLE]';
    }

    try {
        const parts = encryptedValue.split(':');
        if (parts.length !== 5) {
            logger.error('Invalid encrypted format');
            return encryptedValue;
        }

        const [, , ivHex, ciphertextHex, authTagHex] = parts;

        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        logger.error('Decryption failed', error as Error);
        return '[DECRYPTION FAILED]';
    }
}

/**
 * Encrypt a JSON object (for JSONB fields)
 * Encrypts the entire stringified object
 */
export function encryptJson(obj: any): string {
    if (!obj) return obj;

    try {
        const jsonString = JSON.stringify(obj);
        return encrypt(jsonString);
    } catch (error) {
        logger.error('JSON encryption failed', error as Error);
        return JSON.stringify(obj);
    }
}

/**
 * Decrypt a JSON object
 */
export function decryptJson<T>(encryptedValue: string): T | null {
    if (!encryptedValue) return null;

    try {
        const decrypted = decrypt(encryptedValue);
        return JSON.parse(decrypted) as T;
    } catch (error) {
        // Try parsing directly (might be unencrypted JSON)
        try {
            return JSON.parse(encryptedValue) as T;
        } catch {
            logger.error('JSON decryption/parsing failed', error as Error);
            return null;
        }
    }
}

/**
 * Hash a value (one-way, for lookups)
 * Used for email lookups where we don't need to decrypt
 */
export function hash(value: string): string {
    if (!value) return value;

    const { createHash } = require('crypto');
    const hash = createHash('sha256');
    hash.update(value.toLowerCase().trim());
    return hash.digest('hex');
}

/**
 * Generate a new encryption key (for setup)
 */
export function generateEncryptionKey(): string {
    return randomBytes(32).toString('hex');
}

// Log encryption status on module load
if (isEncryptionEnabled()) {
    logger.info('Field-level encryption is ENABLED');
} else {
    logger.warn('Field-level encryption is DISABLED - set DB_ENCRYPTION_KEY to enable');
}

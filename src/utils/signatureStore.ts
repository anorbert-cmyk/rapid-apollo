// ===========================================
// SIGNATURE STORE - Prevent signature replay attacks
// Supports Redis (production) with in-memory fallback (dev)
// ===========================================

import { CONSTANTS } from '../constants';
import Redis from 'ioredis';
import { logger } from './logger';

interface UsedSignature {
    timestamp: number;
    wallet: string;
}

// ===========================================
// REDIS CLIENT (reuse from store.ts pattern)
// ===========================================
let redisClient: Redis | null = null;
const REDIS_PREFIX = 'sig:';

if (process.env.REDIS_URL) {
    try {
        redisClient = new Redis(process.env.REDIS_URL);
        redisClient.on('error', (err) => logger.error('Redis signature store error', err));
        logger.info('Signature store using Redis');
    } catch (e) {
        logger.warn('Failed to connect Redis for signatures, using in-memory');
    }
} else {
    logger.info('Signature store using in-memory (no REDIS_URL)');
}

// ===========================================
// IN-MEMORY FALLBACK
// ===========================================
const usedSignatures = new Map<string, UsedSignature>();

// Cleanup expired signatures periodically (in-memory only)
setInterval(() => {
    if (redisClient) return; // Redis handles TTL automatically

    const now = Date.now();
    const expiryMs = CONSTANTS.SIGNATURE_VALIDITY_MS * 2;

    for (const [sig, data] of usedSignatures.entries()) {
        if (now - data.timestamp > expiryMs) {
            usedSignatures.delete(sig);
        }
    }
}, 60000);

// ===========================================
// PUBLIC API
// ===========================================

/**
 * Check if a signature has already been used (atomic operation)
 * @param signature - The signature to check
 * @param wallet - The wallet address
 * @returns true if signature is valid (not used before), false if replay attempt
 */
export async function checkAndMarkSignatureAsync(signature: string, wallet: string): Promise<boolean> {
    const sigKey = signature.toLowerCase();

    if (redisClient) {
        // Redis: Use SETNX for atomic check-and-set
        const key = `${REDIS_PREFIX}${sigKey}`;
        const ttlSeconds = Math.ceil((CONSTANTS.SIGNATURE_VALIDITY_MS * 2) / 1000);

        // SETNX returns 1 if key was set (new), 0 if key already existed (replay)
        const result = await redisClient.set(key, JSON.stringify({ timestamp: Date.now(), wallet }), 'EX', ttlSeconds, 'NX');

        return result === 'OK';
    }

    // In-memory fallback
    if (usedSignatures.has(sigKey)) {
        return false;
    }

    usedSignatures.set(sigKey, {
        timestamp: Date.now(),
        wallet: wallet.toLowerCase()
    });

    return true;
}

/**
 * Synchronous wrapper for backward compatibility
 * NOTE: This should be migrated to async version for Redis support
 */
export function checkAndMarkSignature(signature: string, wallet: string): boolean {
    const sigKey = signature.toLowerCase();

    if (redisClient) {
        // For sync calls, we can't use Redis properly
        // This is a race condition risk! Use async version in routes.
        logger.warn('Sync checkAndMarkSignature called with Redis enabled - use async version');

        // Best effort: check in-memory cache as backup
        if (usedSignatures.has(sigKey)) {
            return false;
        }
        usedSignatures.set(sigKey, { timestamp: Date.now(), wallet: wallet.toLowerCase() });

        // Fire-and-forget Redis set
        const key = `${REDIS_PREFIX}${sigKey}`;
        const ttlSeconds = Math.ceil((CONSTANTS.SIGNATURE_VALIDITY_MS * 2) / 1000);
        redisClient.set(key, JSON.stringify({ timestamp: Date.now(), wallet }), 'EX', ttlSeconds, 'NX')
            .catch(e => logger.error('Redis signature set failed', e));

        return true;
    }

    // In-memory fallback (original behavior)
    if (usedSignatures.has(sigKey)) {
        return false;
    }

    usedSignatures.set(sigKey, {
        timestamp: Date.now(),
        wallet: wallet.toLowerCase()
    });

    return true;
}

/**
 * Get stats about signature store (for debugging/admin)
 */
export function getSignatureStoreStats(): { count: number; type: string } {
    return {
        count: usedSignatures.size,
        type: redisClient ? 'redis' : 'memory'
    };
}

// ===========================================
// REDIS STORE ADAPTER
// Hybrid store: Redis in production, in-memory in development
// ===========================================

import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

let redisClient: RedisClientType | null = null;
let redisConnected = false;

// In-memory fallback store
const memoryStore: Map<string, { value: string; expiresAt: number | null }> = new Map();

/**
 * Initialize Redis connection
 * Falls back to in-memory if Redis is unavailable
 */
export async function initRedisStore(): Promise<boolean> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        logger.info('REDIS_URL not set - using in-memory store');
        return false;
    }

    try {
        redisClient = createClient({ url: redisUrl });

        redisClient.on('error', (err: Error) => {
            logger.error('Redis client error', err);
            redisConnected = false;
        });

        redisClient.on('connect', () => {
            logger.info('Redis store connected');
            redisConnected = true;
        });

        redisClient.on('reconnecting', () => {
            logger.warn('Redis reconnecting...');
        });

        await redisClient.connect();
        redisConnected = true;
        return true;

    } catch (error) {
        logger.warn('Redis connection failed, using in-memory fallback', { error: (error as Error).message });
        redisClient = null;
        redisConnected = false;
        return false;
    }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
    return redisConnected && redisClient !== null;
}

/**
 * Get a value from the store
 * @param key - Key to retrieve
 * @returns Value or null if not found/expired
 */
export async function get(key: string): Promise<string | null> {
    if (isRedisAvailable() && redisClient) {
        try {
            return await redisClient.get(key);
        } catch (error) {
            logger.warn('Redis GET failed, falling back to memory', { key });
        }
    }

    // Fallback to memory
    const entry = memoryStore.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
        memoryStore.delete(key);
        return null;
    }

    return entry.value;
}

/**
 * Set a value in the store
 * @param key - Key to set
 * @param value - Value to store
 * @param ttlSeconds - Optional TTL in seconds
 */
export async function set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (isRedisAvailable() && redisClient) {
        try {
            if (ttlSeconds) {
                await redisClient.setEx(key, ttlSeconds, value);
            } else {
                await redisClient.set(key, value);
            }
            return;
        } catch (error) {
            logger.warn('Redis SET failed, falling back to memory', { key });
        }
    }

    // Fallback to memory
    memoryStore.set(key, {
        value,
        expiresAt: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null
    });
}

/**
 * Delete a value from the store
 */
export async function del(key: string): Promise<void> {
    if (isRedisAvailable() && redisClient) {
        try {
            await redisClient.del(key);
            return;
        } catch (error) {
            logger.warn('Redis DEL failed', { key });
        }
    }

    memoryStore.delete(key);
}

/**
 * Check if a key exists (atomic SETNX for idempotency)
 * Returns true if the key was set (didn't exist), false if it already existed
 */
export async function setIfNotExists(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (isRedisAvailable() && redisClient) {
        try {
            const result = await redisClient.setNX(key, value);
            if (result) {
                await redisClient.expire(key, ttlSeconds);
            }
            return !!result;
        } catch (error) {
            logger.warn('Redis SETNX failed, falling back to memory', { key });
        }
    }

    // Fallback to memory (fixed race condition: use get instead of has+set)
    const existing = memoryStore.get(key);
    if (existing && (!existing.expiresAt || Date.now() < existing.expiresAt)) {
        return false; // Already exists and not expired
    }

    memoryStore.set(key, {
        value,
        expiresAt: Date.now() + (ttlSeconds * 1000)
    });
    return true;
}

/**
 * Get store statistics
 */
export function getStoreStats(): {
    type: 'redis' | 'memory';
    connected: boolean;
    memoryKeys: number;
} {
    return {
        type: isRedisAvailable() ? 'redis' : 'memory',
        connected: redisConnected,
        memoryKeys: memoryStore.size
    };
}

/**
 * Close Redis connection
 */
export async function closeRedisStore(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        redisConnected = false;
        logger.info('Redis store closed');
    }
}

/**
 * Clear all keys (for testing)
 */
export async function clearStore(): Promise<void> {
    if (isRedisAvailable() && redisClient) {
        await redisClient.flushDb();
    }
    memoryStore.clear();
}

// Cleanup expired memory entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of memoryStore.entries()) {
        if (entry.expiresAt && now > entry.expiresAt) {
            memoryStore.delete(key);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        logger.debug('Cleaned expired memory store entries', { count: cleaned });
    }
}, 5 * 60 * 1000);

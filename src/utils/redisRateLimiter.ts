// ===========================================
// REDIS RATE LIMITER - Production-ready rate limiting
// ===========================================

import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import { CONSTANTS } from '../constants';
import { logger } from './logger';
import { config } from '../config';

// Redis client (lazy initialization)
let redis: Redis | null = null;

function getRedisClient(): Redis | null {
    if (redis) return redis;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        logger.warn('REDIS_URL not set, falling back to in-memory rate limiting');
        return null;
    }

    try {
        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            retryStrategy: (times) => Math.min(times * 100, 3000)
        });

        redis.on('error', (err) => {
            logger.error('Redis connection error', err);
        });

        redis.on('connect', () => {
            logger.info('Redis connected for rate limiting');
        });

        return redis;
    } catch (err) {
        logger.error('Failed to initialize Redis', err as Error);
        return null;
    }
}

// In-memory fallback store
const memoryStore = new Map<string, { count: number; timestamp: number }>();

// Cleanup memory store periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryStore.entries()) {
        if (now - value.timestamp > CONSTANTS.WALLET_RATE_LIMIT_WINDOW_MS) {
            memoryStore.delete(key);
        }
    }
}, 60000);

/**
 * Check if a request is allowed based on wallet address
 */
async function isWalletAllowed(walletAddress: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetIn: number;
}> {
    const key = `ratelimit:wallet:${walletAddress.toLowerCase()}`;
    const windowMs = CONSTANTS.WALLET_RATE_LIMIT_WINDOW_MS;
    const maxRequests = CONSTANTS.WALLET_RATE_LIMIT_MAX_REQUESTS;

    const client = getRedisClient();

    if (client) {
        try {
            // Use Redis for distributed rate limiting
            const now = Date.now();
            const windowStart = now - windowMs;

            // Use sorted set for sliding window
            await client.zremrangebyscore(key, 0, windowStart);
            const count = await client.zcard(key);

            if (count >= maxRequests) {
                const oldestEntry = await client.zrange(key, 0, 0, 'WITHSCORES');
                const resetIn = oldestEntry.length > 1
                    ? Math.ceil((parseInt(oldestEntry[1]) + windowMs - now) / 1000)
                    : Math.ceil(windowMs / 1000);

                return { allowed: false, remaining: 0, resetIn };
            }

            // Add new request
            await client.zadd(key, now, `${now}:${Math.random()}`);
            await client.expire(key, Math.ceil(windowMs / 1000) + 1);

            return {
                allowed: true,
                remaining: maxRequests - count - 1,
                resetIn: Math.ceil(windowMs / 1000)
            };
        } catch (err) {
            logger.error('Redis rate limit error, falling back to memory', err as Error);
            // Fall through to memory store
        }
    }

    // In-memory fallback
    const now = Date.now();
    const entry = memoryStore.get(key);

    if (!entry || now - entry.timestamp > windowMs) {
        memoryStore.set(key, { count: 1, timestamp: now });
        return { allowed: true, remaining: maxRequests - 1, resetIn: Math.ceil(windowMs / 1000) };
    }

    if (entry.count >= maxRequests) {
        const resetIn = Math.ceil((entry.timestamp + windowMs - now) / 1000);
        return { allowed: false, remaining: 0, resetIn };
    }

    entry.count++;
    return {
        allowed: true,
        remaining: maxRequests - entry.count,
        resetIn: Math.ceil((entry.timestamp + windowMs - now) / 1000)
    };
}

/**
 * Redis-backed wallet rate limiter middleware
 */
export async function redisWalletRateLimiter(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const walletAddress = req.body?.address?.toLowerCase() || req.body?.walletAddress?.toLowerCase();

    if (!walletAddress) {
        return next();
    }

    const result = await isWalletAllowed(walletAddress);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', CONSTANTS.WALLET_RATE_LIMIT_MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetIn);

    if (!result.allowed) {
        logger.warn('Wallet rate limit exceeded (Redis)', { wallet: walletAddress });
        res.status(429).json({
            error: 'Too many requests from this wallet. Please try again later.',
            retryAfter: result.resetIn
        });
        return;
    }

    next();
}

/**
 * Get Redis connection status
 */
export function getRedisStatus(): { connected: boolean; type: 'redis' | 'memory' } {
    const client = getRedisClient();
    return {
        connected: client?.status === 'ready',
        type: client?.status === 'ready' ? 'redis' : 'memory'
    };
}

/**
 * Graceful shutdown
 */
export async function closeRedis(): Promise<void> {
    if (redis) {
        await redis.quit();
        redis = null;
    }
}

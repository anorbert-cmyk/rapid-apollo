// ===========================================
// WEBHOOK IDEMPOTENCY STORE
// Prevents duplicate webhook processing with Redis-backed storage
// ===========================================

import { logger } from './logger';
import * as redisStore from './redisStore';

interface ProcessedWebhook {
    eventId: string;
    eventType: string;
    processedAt: number;
    provider: 'stripe' | 'coinbase';
}

// In-memory fallback store (used when Redis unavailable or for sync operations)
const memoryStore: Map<string, ProcessedWebhook> = new Map();

// TTL for webhook entries (24 hours in seconds for Redis)
const WEBHOOK_TTL_SECONDS = 24 * 60 * 60;
const WEBHOOK_TTL_MS = WEBHOOK_TTL_SECONDS * 1000;

// Key prefix for Redis
const KEY_PREFIX = 'webhook:idempotency:';

/**
 * Check if a webhook has already been processed (async, uses Redis)
 * @param eventId - Unique event identifier from the payment provider
 * @param provider - Payment provider (stripe or coinbase)
 * @returns true if already processed, false if not
 */
export async function isWebhookProcessedAsync(
    eventId: string,
    provider: 'stripe' | 'coinbase'
): Promise<boolean> {
    const key = `${KEY_PREFIX}${provider}:${eventId}`;

    try {
        const result = await redisStore.get(key);
        return result !== null;
    } catch (error) {
        logger.warn('Redis check failed, falling back to memory', { eventId, provider });
        return memoryStore.has(`${provider}:${eventId}`);
    }
}

/**
 * Check if a webhook has already been processed (sync, memory-only)
 * @deprecated Use isWebhookProcessedAsync for production
 */
export function isWebhookProcessed(eventId: string, provider: 'stripe' | 'coinbase'): boolean {
    const key = `${provider}:${eventId}`;
    return memoryStore.has(key);
}

/**
 * Mark a webhook as processed (async, uses Redis)
 * @param eventId - Unique event identifier
 * @param eventType - Type of the event (e.g., 'checkout.session.completed')
 * @param provider - Payment provider
 */
export async function markWebhookProcessedAsync(
    eventId: string,
    eventType: string,
    provider: 'stripe' | 'coinbase'
): Promise<void> {
    const key = `${KEY_PREFIX}${provider}:${eventId}`;
    const memoryKey = `${provider}:${eventId}`;

    const webhookData: ProcessedWebhook = {
        eventId,
        eventType,
        processedAt: Date.now(),
        provider
    };

    // Store in Redis with TTL
    try {
        await redisStore.set(key, JSON.stringify(webhookData), WEBHOOK_TTL_SECONDS);
    } catch (error) {
        logger.warn('Redis store failed, using memory only', { eventId, provider });
    }

    // Always store in memory as fallback
    memoryStore.set(memoryKey, webhookData);

    logger.debug('Webhook marked as processed', { eventId, eventType, provider, storage: redisStore.isRedisAvailable() ? 'redis' : 'memory' });
}

/**
 * Mark a webhook as processed (sync, memory-only)
 * @deprecated Use markWebhookProcessedAsync for production
 */
export function markWebhookProcessed(
    eventId: string,
    eventType: string,
    provider: 'stripe' | 'coinbase'
): void {
    const key = `${provider}:${eventId}`;

    memoryStore.set(key, {
        eventId,
        eventType,
        processedAt: Date.now(),
        provider
    });

    logger.debug('Webhook marked as processed (memory)', { eventId, eventType, provider });
}

/**
 * Atomic check-and-set for webhook processing (prevents race conditions)
 * @param eventId - Unique event identifier
 * @param eventType - Type of the event
 * @param provider - Payment provider
 * @returns true if webhook was NOT processed and is now marked, false if already processed
 */
export async function tryMarkWebhookProcessed(
    eventId: string,
    eventType: string,
    provider: 'stripe' | 'coinbase'
): Promise<boolean> {
    const key = `${KEY_PREFIX}${provider}:${eventId}`;
    const memoryKey = `${provider}:${eventId}`;

    const webhookData: ProcessedWebhook = {
        eventId,
        eventType,
        processedAt: Date.now(),
        provider
    };

    // Atomic SETNX operation in Redis
    const wasSet = await redisStore.setIfNotExists(key, JSON.stringify(webhookData), WEBHOOK_TTL_SECONDS);

    if (wasSet) {
        // Also store in memory
        memoryStore.set(memoryKey, webhookData);
        logger.debug('Webhook atomically marked as processed', { eventId, eventType, provider });
        return true;
    }

    logger.debug('Webhook already processed (atomic check)', { eventId, provider });
    return false;
}

/**
 * Get webhook processing status (async, uses Redis)
 * @param eventId - Event identifier
 * @param provider - Payment provider
 * @returns Processing info or null if not found
 */
export async function getWebhookStatusAsync(
    eventId: string,
    provider: 'stripe' | 'coinbase'
): Promise<ProcessedWebhook | null> {
    const key = `${KEY_PREFIX}${provider}:${eventId}`;

    try {
        const result = await redisStore.get(key);
        if (result) {
            return JSON.parse(result) as ProcessedWebhook;
        }
    } catch (error) {
        logger.warn('Redis get failed, falling back to memory', { eventId, provider });
    }

    // Fallback to memory
    return memoryStore.get(`${provider}:${eventId}`) || null;
}

/**
 * Get webhook processing status (sync, memory-only)
 * @deprecated Use getWebhookStatusAsync for production
 */
export function getWebhookStatus(
    eventId: string,
    provider: 'stripe' | 'coinbase'
): ProcessedWebhook | null {
    const key = `${provider}:${eventId}`;
    return memoryStore.get(key) || null;
}

/**
 * Clean up expired webhook entries (memory store only)
 * Redis handles expiration automatically via TTL
 */
function cleanupExpiredWebhooks(): void {
    const cutoff = Date.now() - WEBHOOK_TTL_MS;
    let cleaned = 0;

    for (const [key, webhook] of memoryStore.entries()) {
        if (webhook.processedAt < cutoff) {
            memoryStore.delete(key);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        logger.debug('Cleaned up expired memory webhook entries', { count: cleaned });
    }
}

/**
 * Get statistics about the webhook store
 */
export function getWebhookStoreStats(): {
    totalEntries: number;
    stripeEntries: number;
    coinbaseEntries: number;
    storageType: 'redis' | 'memory';
} {
    let stripeCount = 0;
    let coinbaseCount = 0;

    for (const webhook of memoryStore.values()) {
        if (webhook.provider === 'stripe') stripeCount++;
        else if (webhook.provider === 'coinbase') coinbaseCount++;
    }

    return {
        totalEntries: memoryStore.size,
        stripeEntries: stripeCount,
        coinbaseEntries: coinbaseCount,
        storageType: redisStore.isRedisAvailable() ? 'redis' : 'memory'
    };
}

/**
 * Clear all processed webhooks (for testing)
 */
export async function clearWebhookStoreAsync(): Promise<void> {
    memoryStore.clear();
    await redisStore.clearStore();
    logger.debug('Webhook store cleared (both Redis and memory)');
}

/**
 * Clear all processed webhooks (sync, memory-only)
 */
export function clearWebhookStore(): void {
    memoryStore.clear();
    logger.debug('Webhook memory store cleared');
}

// Start cleanup interval for memory store (every hour)
setInterval(cleanupExpiredWebhooks, 60 * 60 * 1000);

// Initial cleanup on load
cleanupExpiredWebhooks();

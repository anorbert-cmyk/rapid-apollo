// ===========================================
// WEBHOOK IDEMPOTENCY STORE
// Prevents duplicate webhook processing
// ===========================================

import { logger } from './logger';

interface ProcessedWebhook {
    eventId: string;
    eventType: string;
    processedAt: number;
    provider: 'stripe' | 'coinbase';
}

// In-memory store for processed webhooks
// In production, this should be Redis or database-backed
const processedWebhooks: Map<string, ProcessedWebhook> = new Map();

// TTL for webhook entries (24 hours)
const WEBHOOK_TTL_MS = 24 * 60 * 60 * 1000;

// Cleanup interval (1 hour)
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Check if a webhook has already been processed
 * @param eventId - Unique event identifier from the payment provider
 * @param provider - Payment provider (stripe or coinbase)
 * @returns true if already processed, false if not
 */
export function isWebhookProcessed(eventId: string, provider: 'stripe' | 'coinbase'): boolean {
    const key = `${provider}:${eventId}`;
    return processedWebhooks.has(key);
}

/**
 * Mark a webhook as processed
 * @param eventId - Unique event identifier
 * @param eventType - Type of the event (e.g., 'checkout.session.completed')
 * @param provider - Payment provider
 */
export function markWebhookProcessed(
    eventId: string,
    eventType: string,
    provider: 'stripe' | 'coinbase'
): void {
    const key = `${provider}:${eventId}`;

    processedWebhooks.set(key, {
        eventId,
        eventType,
        processedAt: Date.now(),
        provider
    });

    logger.debug('Webhook marked as processed', { eventId, eventType, provider });
}

/**
 * Get webhook processing status
 * @param eventId - Event identifier
 * @param provider - Payment provider
 * @returns Processing info or null if not found
 */
export function getWebhookStatus(
    eventId: string,
    provider: 'stripe' | 'coinbase'
): ProcessedWebhook | null {
    const key = `${provider}:${eventId}`;
    return processedWebhooks.get(key) || null;
}

/**
 * Clean up expired webhook entries
 */
function cleanupExpiredWebhooks(): void {
    const cutoff = Date.now() - WEBHOOK_TTL_MS;
    let cleaned = 0;

    for (const [key, webhook] of processedWebhooks.entries()) {
        if (webhook.processedAt < cutoff) {
            processedWebhooks.delete(key);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        logger.debug('Cleaned up expired webhook entries', { count: cleaned });
    }
}

/**
 * Get statistics about the webhook store
 */
export function getWebhookStoreStats(): {
    totalEntries: number;
    stripeEntries: number;
    coinbaseEntries: number;
} {
    let stripeCount = 0;
    let coinbaseCount = 0;

    for (const webhook of processedWebhooks.values()) {
        if (webhook.provider === 'stripe') stripeCount++;
        else if (webhook.provider === 'coinbase') coinbaseCount++;
    }

    return {
        totalEntries: processedWebhooks.size,
        stripeEntries: stripeCount,
        coinbaseEntries: coinbaseCount
    };
}

/**
 * Clear all processed webhooks (for testing)
 */
export function clearWebhookStore(): void {
    processedWebhooks.clear();
    logger.debug('Webhook store cleared');
}

// Start cleanup interval
setInterval(cleanupExpiredWebhooks, CLEANUP_INTERVAL_MS);

// Initial cleanup on load
cleanupExpiredWebhooks();

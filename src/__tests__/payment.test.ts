/**
 * Unit tests for payment services and routes
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
    isWebhookProcessed,
    markWebhookProcessed,
    clearWebhookStore,
    getWebhookStoreStats
} from '../utils/webhookIdempotency';
import {
    stripeSessionRequestSchema,
    coinbaseChargeRequestSchema
} from '../utils/validators';

// Mock Stripe and Coinbase services
jest.mock('../services/stripeService', () => ({
    isStripeConfigured: () => true,
    createCheckoutSession: jest.fn<any>().mockResolvedValue({
        success: true,
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/test'
    }),
    verifyWebhookSignature: jest.fn(),
    getCheckoutSession: jest.fn()
}));

jest.mock('../services/coinbaseService', () => ({
    isCoinbaseConfigured: () => true,
    createCharge: jest.fn<any>().mockResolvedValue({
        success: true,
        chargeId: 'charge_123',
        code: 'ABC123',
        hostedUrl: 'https://commerce.coinbase.com/charges/ABC123'
    }),
    verifyWebhookSignature: jest.fn()
}));

describe('Webhook Idempotency Store', () => {
    beforeEach(() => {
        clearWebhookStore();
    });

    it('should return false for unprocessed webhooks', () => {
        expect(isWebhookProcessed('evt_123', 'stripe')).toBe(false);
    });

    it('should return true for processed webhooks', () => {
        markWebhookProcessed('evt_123', 'checkout.session.completed', 'stripe');
        expect(isWebhookProcessed('evt_123', 'stripe')).toBe(true);
    });

    it('should differentiate between providers', () => {
        markWebhookProcessed('evt_123', 'checkout.session.completed', 'stripe');
        expect(isWebhookProcessed('evt_123', 'stripe')).toBe(true);
        expect(isWebhookProcessed('evt_123', 'coinbase')).toBe(false);
    });

    it('should track stats correctly', () => {
        markWebhookProcessed('evt_1', 'type1', 'stripe');
        markWebhookProcessed('evt_2', 'type2', 'stripe');
        markWebhookProcessed('evt_3', 'type3', 'coinbase');

        const stats = getWebhookStoreStats();
        expect(stats.totalEntries).toBe(3);
        expect(stats.stripeEntries).toBe(2);
        expect(stats.coinbaseEntries).toBe(1);
    });

    it('should clear store correctly', () => {
        markWebhookProcessed('evt_1', 'type1', 'stripe');
        clearWebhookStore();
        expect(isWebhookProcessed('evt_1', 'stripe')).toBe(false);
        expect(getWebhookStoreStats().totalEntries).toBe(0);
    });
});

describe('Payment Validators', () => {
    describe('stripeSessionRequestSchema', () => {
        it('should validate valid request', () => {
            const result = stripeSessionRequestSchema.safeParse({
                tier: 'standard',
                problemStatement: 'This is a valid problem statement with enough characters'
            });
            expect(result.success).toBe(true);
        });

        it('should reject invalid tier', () => {
            const result = stripeSessionRequestSchema.safeParse({
                tier: 'invalid',
                problemStatement: 'This is a valid problem statement'
            });
            expect(result.success).toBe(false);
        });

        it('should reject short problem statement', () => {
            const result = stripeSessionRequestSchema.safeParse({
                tier: 'standard',
                problemStatement: 'Short'
            });
            expect(result.success).toBe(false);
        });

        it('should reject missing fields', () => {
            const result = stripeSessionRequestSchema.safeParse({});
            expect(result.success).toBe(false);
        });
    });

    describe('coinbaseChargeRequestSchema', () => {
        it('should validate valid request without wallet', () => {
            const result = coinbaseChargeRequestSchema.safeParse({
                tier: 'medium',
                problemStatement: 'This is a valid problem statement with enough characters'
            });
            expect(result.success).toBe(true);
        });

        it('should validate valid request with wallet', () => {
            const result = coinbaseChargeRequestSchema.safeParse({
                tier: 'full',
                problemStatement: 'This is a valid problem statement with enough characters',
                walletAddress: '0x1234567890123456789012345678901234567890'
            });
            expect(result.success).toBe(true);
        });

        it('should reject invalid wallet address', () => {
            const result = coinbaseChargeRequestSchema.safeParse({
                tier: 'standard',
                problemStatement: 'This is a valid problem statement',
                walletAddress: 'invalid'
            });
            expect(result.success).toBe(false);
        });
    });
});

describe('Payment Service Integration', () => {
    it('should accept all valid tiers', () => {
        const tiers = ['standard', 'medium', 'full'];
        for (const tier of tiers) {
            const result = stripeSessionRequestSchema.safeParse({
                tier,
                problemStatement: 'A sufficiently long problem statement for validation'
            });
            expect(result.success).toBe(true);
        }
    });

    it('should trim whitespace from problem statement', () => {
        const result = stripeSessionRequestSchema.safeParse({
            tier: 'standard',
            problemStatement: '   This is a valid problem statement with whitespace   '
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.problemStatement).toBe('This is a valid problem statement with whitespace');
        }
    });
});

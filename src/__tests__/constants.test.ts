/**
 * Constants Unit Tests
 */

import { CONSTANTS } from '../constants';

describe('CONSTANTS', () => {
    describe('Rate Limiting', () => {
        it('should have valid rate limit window', () => {
            expect(CONSTANTS.RATE_LIMIT_WINDOW_MS).toBeGreaterThan(0);
            expect(CONSTANTS.RATE_LIMIT_WINDOW_MS).toBe(15 * 60 * 1000); // 15 minutes
        });

        it('should have valid rate limit max requests', () => {
            expect(CONSTANTS.RATE_LIMIT_MAX_REQUESTS).toBeGreaterThan(0);
            expect(CONSTANTS.RATE_LIMIT_MAX_REQUESTS).toBe(100);
        });

        it('should have valid wallet rate limit', () => {
            expect(CONSTANTS.WALLET_RATE_LIMIT_MAX_REQUESTS).toBeGreaterThan(0);
            expect(CONSTANTS.WALLET_RATE_LIMIT_WINDOW_MS).toBeGreaterThan(0);
        });
    });

    describe('Signature Validation', () => {
        it('should have valid signature validity window', () => {
            expect(CONSTANTS.SIGNATURE_VALIDITY_MS).toBeGreaterThan(0);
            expect(CONSTANTS.SIGNATURE_VALIDITY_MS).toBe(5 * 60 * 1000); // 5 minutes
        });
    });

    describe('Transaction History', () => {
        it('should have valid max transactions', () => {
            expect(CONSTANTS.MAX_TRANSACTIONS_LOG).toBeGreaterThan(0);
        });

        it('should have valid max user history', () => {
            expect(CONSTANTS.MAX_USER_HISTORY).toBeGreaterThan(0);
        });
    });

    describe('UI Configuration', () => {
        it('should have reasonable toast duration', () => {
            expect(CONSTANTS.TOAST_DURATION_MS).toBeGreaterThanOrEqual(3000);
            expect(CONSTANTS.TOAST_DURATION_MS).toBeLessThanOrEqual(15000);
        });
    });

    describe('Tier Prices', () => {
        it('should have correct tier prices', () => {
            expect(CONSTANTS.TIER_PRICES_USD.standard).toBe(19);
            expect(CONSTANTS.TIER_PRICES_USD.medium).toBe(49);
            expect(CONSTANTS.TIER_PRICES_USD.full).toBe(199);
        });

        it('should have increasing prices', () => {
            expect(CONSTANTS.TIER_PRICES_USD.medium).toBeGreaterThan(CONSTANTS.TIER_PRICES_USD.standard);
            expect(CONSTANTS.TIER_PRICES_USD.full).toBeGreaterThan(CONSTANTS.TIER_PRICES_USD.medium);
        });
    });

    describe('API Versioning', () => {
        it('should have valid API version', () => {
            expect(CONSTANTS.API_VERSION).toBe('v1');
            expect(CONSTANTS.API_BASE_PATH).toBe('/api/v1');
        });
    });
});

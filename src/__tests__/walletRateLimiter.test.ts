/**
 * Wallet Rate Limiter Unit Tests
 * 
 * Tests the middleware export and status function
 */

import { walletRateLimiter, getWalletRateLimitStatus } from '../utils/walletRateLimiter';
import { Request, Response, NextFunction } from 'express';
import { CONSTANTS } from '../constants';

// Mock request/response objects
function createMockRequest(body: Record<string, unknown> = {}): Partial<Request> {
    return { body };
}

function createMockResponse(): Partial<Response> {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('walletRateLimiter', () => {
    describe('middleware', () => {
        it('should be a function (Express middleware)', () => {
            expect(typeof walletRateLimiter).toBe('function');
        });

        it('should call next when no wallet address provided', () => {
            const req = createMockRequest({});
            const res = createMockResponse();
            const next = jest.fn();

            walletRateLimiter(req as Request, res as Response, next as NextFunction);

            expect(next).toHaveBeenCalled();
        });

        it('should call next for valid wallet address', () => {
            const req = createMockRequest({ address: '0xmiddlewaretest1111111111' });
            const res = createMockResponse();
            const next = jest.fn();

            walletRateLimiter(req as Request, res as Response, next as NextFunction);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('getWalletRateLimitStatus', () => {
        it('should return full limit for unknown wallet', () => {
            const status = getWalletRateLimitStatus('0xunknownwalletaddress1234');

            expect(status).not.toBeNull();
            expect(status?.remaining).toBe(CONSTANTS.WALLET_RATE_LIMIT_MAX_REQUESTS);
        });

        it('should return non-null status', () => {
            const status = getWalletRateLimitStatus('0xanywallet123');
            expect(status).toBeDefined();
        });
    });
});

// ===========================================
// WALLET RATE LIMITER - Per-wallet rate limiting
// ===========================================

import { Request, Response, NextFunction } from 'express';
import { CONSTANTS } from '../constants';
import { logger } from './logger';

interface RateLimitEntry {
    count: number;
    firstRequest: number;
}

// In-memory store for wallet rate limits
// In production, this should use Redis for multi-instance support
const walletRateLimits = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [wallet, entry] of walletRateLimits.entries()) {
        if (now - entry.firstRequest > CONSTANTS.WALLET_RATE_LIMIT_WINDOW_MS) {
            walletRateLimits.delete(wallet);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        logger.debug('Wallet rate limit cleanup', { entriesCleaned: cleaned });
    }
}, 60000); // Cleanup every minute

/**
 * Per-wallet rate limiting middleware
 * Limits requests based on wallet address in addition to IP
 */
export function walletRateLimiter(req: Request, res: Response, next: NextFunction): void {
    // Extract wallet address from body (for POST requests)
    const walletAddress = req.body?.address?.toLowerCase() || req.body?.walletAddress?.toLowerCase();

    if (!walletAddress) {
        // No wallet address, skip wallet-based limiting
        return next();
    }

    const now = Date.now();
    const entry = walletRateLimits.get(walletAddress);

    if (!entry) {
        // First request from this wallet
        walletRateLimits.set(walletAddress, {
            count: 1,
            firstRequest: now
        });
        return next();
    }

    // Check if window has expired
    if (now - entry.firstRequest > CONSTANTS.WALLET_RATE_LIMIT_WINDOW_MS) {
        // Reset the window
        walletRateLimits.set(walletAddress, {
            count: 1,
            firstRequest: now
        });
        return next();
    }

    // Within window, check count
    if (entry.count >= CONSTANTS.WALLET_RATE_LIMIT_MAX_REQUESTS) {
        logger.warn('Wallet rate limit exceeded', {
            wallet: walletAddress,
            count: entry.count,
            windowMs: CONSTANTS.WALLET_RATE_LIMIT_WINDOW_MS
        });

        res.status(429).json({
            error: 'Too many requests from this wallet. Please try again later.',
            retryAfter: Math.ceil((entry.firstRequest + CONSTANTS.WALLET_RATE_LIMIT_WINDOW_MS - now) / 1000)
        });
        return;
    }

    // Increment and continue
    entry.count++;
    next();
}

/**
 * Get current rate limit status for a wallet (for debugging/admin)
 */
export function getWalletRateLimitStatus(walletAddress: string): {
    remaining: number;
    resetIn: number;
} | null {
    const entry = walletRateLimits.get(walletAddress.toLowerCase());
    if (!entry) {
        return { remaining: CONSTANTS.WALLET_RATE_LIMIT_MAX_REQUESTS, resetIn: 0 };
    }

    const now = Date.now();
    if (now - entry.firstRequest > CONSTANTS.WALLET_RATE_LIMIT_WINDOW_MS) {
        return { remaining: CONSTANTS.WALLET_RATE_LIMIT_MAX_REQUESTS, resetIn: 0 };
    }

    return {
        remaining: Math.max(0, CONSTANTS.WALLET_RATE_LIMIT_MAX_REQUESTS - entry.count),
        resetIn: Math.ceil((entry.firstRequest + CONSTANTS.WALLET_RATE_LIMIT_WINDOW_MS - now) / 1000)
    };
}

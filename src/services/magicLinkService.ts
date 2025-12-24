// ===========================================
// MAGIC LINK SERVICE - Token Generation & Validation
// ===========================================

import { nanoid } from 'nanoid';
import { createHash } from 'crypto';
import { query, queryOne, isDatabaseAvailable } from '../db';
import { logger } from '../utils/logger';
import * as redisStore from '../utils/redisStore';
import { encrypt, decrypt } from '../utils/encryption';

// Token length (32 chars = ~192 bits of entropy)
const TOKEN_LENGTH = 32;

// Redis key prefix for magic links
const MAGIC_LINK_PREFIX = 'magic_link:';

interface MagicLinkData {
    token: string;
    email: string;
    solutionId: string;
    tier: string;
    createdAt: number;
    problemSummary: string;
    status?: 'processing' | 'completed' | 'failed';
}

/**
 * Generate a secure random token
 */
export function generateToken(): string {
    return nanoid(TOKEN_LENGTH);
}

/**
 * Hash token for storage (security best practice)
 */
function hashToken(token: string): string {
    const secret = process.env.MAGIC_LINK_SECRET;

    // Require secret in production
    if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('MAGIC_LINK_SECRET environment variable is required in production');
    }

    const finalSecret = secret || 'dev-secret-not-for-production';
    return createHash('sha256').update(token + finalSecret).digest('hex');
}

/**
 * Create a magic link and store it
 */
export async function createMagicLink(
    email: string,
    solutionId: string,
    tier: string,
    problemSummary: string,
    status: 'processing' | 'completed' = 'completed'
): Promise<string> {
    const token = generateToken();
    const tokenHash = hashToken(token);

    const data: MagicLinkData = {
        token: tokenHash, // Store hash, not raw token
        email: email.toLowerCase(),
        solutionId,
        tier,
        createdAt: Date.now(),
        problemSummary,
        status
    };

    // Store in PostgreSQL if available
    if (isDatabaseAvailable()) {
        try {
            // Encrypt sensitive fields
            const encryptedEmail = encrypt(data.email);
            const encryptedProblem = encrypt(problemSummary.substring(0, 500));
            // Hash for searchable lookups
            const { hash } = await import('../utils/encryption');
            const emailHash = hash(data.email);

            await query(
                `INSERT INTO magic_links (token, email, email_hash, solution_id, tier, problem_summary, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [tokenHash, encryptedEmail, emailHash, solutionId, tier, encryptedProblem, status]
            );
            logger.debug('Magic link stored in PostgreSQL (encrypted)', { status });
        } catch (error) {
            logger.error('Failed to store magic link in DB', error instanceof Error ? error : new Error(String(error)));
            // Fall back to Redis
        }
    }

    // Also store in Redis for fast lookups
    await redisStore.set(
        MAGIC_LINK_PREFIX + tokenHash,
        JSON.stringify(data),
        0 // No expiry - links never expire
    );

    logger.info('Magic link created', { email: data.email, solutionId, status });

    return token; // Return raw token for URL
}

/**
 * Update magic link status (e.g., from 'processing' to 'completed')
 */
export async function updateMagicLinkStatus(
    solutionId: string,
    status: 'processing' | 'completed' | 'failed'
): Promise<void> {
    // Update in PostgreSQL
    if (isDatabaseAvailable()) {
        try {
            await query(
                `UPDATE magic_links SET status = $1 WHERE solution_id = $2`,
                [status, solutionId]
            );
            logger.debug('Magic link status updated in PostgreSQL', { solutionId, status });
        } catch (error) {
            logger.error('Failed to update magic link status', error instanceof Error ? error : new Error(String(error)));
        }
    }

    // Update in Redis - need to find and update the cached entry
    // This is done lazily on next read, so we just log for now
    logger.info('Magic link status updated', { solutionId, status });
}

/**
 * Validate a magic link token and return associated data
 */
export async function validateMagicToken(token: string): Promise<MagicLinkData | null> {
    const tokenHash = hashToken(token);

    // Try Redis first (faster)
    const redisData = await redisStore.get(MAGIC_LINK_PREFIX + tokenHash);
    if (redisData) {
        logger.debug('Magic link validated from Redis');
        return JSON.parse(redisData) as MagicLinkData;
    }

    // Try PostgreSQL
    if (isDatabaseAvailable()) {
        try {
            const row = await queryOne<{
                token: string;
                email: string;
                solution_id: string;
                tier: string;
                created_at: Date;
                problem_summary: string;
                is_valid: boolean;
            }>(
                `SELECT * FROM magic_links WHERE token = $1 AND is_valid = true`,
                [tokenHash]
            );

            if (row) {
                // Decrypt sensitive fields
                const decryptedEmail = decrypt(row.email);
                const decryptedProblem = decrypt(row.problem_summary);

                const data: MagicLinkData = {
                    token: row.token,
                    email: decryptedEmail,
                    solutionId: row.solution_id,
                    tier: row.tier,
                    createdAt: new Date(row.created_at).getTime(),
                    problemSummary: decryptedProblem
                };

                // Cache in Redis for future fast lookups
                await redisStore.set(
                    MAGIC_LINK_PREFIX + tokenHash,
                    JSON.stringify(data),
                    0
                );

                logger.debug('Magic link validated from PostgreSQL');
                return data;
            }
        } catch (error) {
            logger.error('Failed to validate magic link from DB', error instanceof Error ? error : new Error(String(error)));
        }
    }

    logger.warn('Magic link validation failed - token not found', { tokenHash: tokenHash.substring(0, 8) + '...' });
    return null;
}

/**
 * Get all solutions for an email address
 */
export async function getSolutionsByEmail(email: string): Promise<MagicLinkData[]> {
    const normalizedEmail = email.toLowerCase();
    const solutions: MagicLinkData[] = [];

    if (isDatabaseAvailable()) {
        try {
            // Hash email for lookup (encryption-compatible)
            const { hash } = await import('../utils/encryption');
            const emailHash = hash(normalizedEmail);

            // Search by email_hash (new encrypted records) OR by email (legacy unencrypted)
            const rows = await query<{
                token: string;
                email: string;
                solution_id: string;
                tier: string;
                created_at: Date;
                problem_summary: string;
            }>(
                `SELECT * FROM magic_links 
                 WHERE (email_hash = $1 OR email = $2) AND is_valid = true 
                 ORDER BY created_at DESC`,
                [emailHash, normalizedEmail]
            );

            for (const row of rows) {
                // Decrypt sensitive fields (handles both encrypted and unencrypted)
                const decryptedEmail = decrypt(row.email);
                const decryptedProblem = decrypt(row.problem_summary);

                solutions.push({
                    token: row.token,
                    email: decryptedEmail,
                    solutionId: row.solution_id,
                    tier: row.tier,
                    createdAt: new Date(row.created_at).getTime(),
                    problemSummary: decryptedProblem
                });
            }
        } catch (error) {
            logger.error('Failed to get solutions by email', error instanceof Error ? error : new Error(String(error)));
        }
    }

    return solutions;
}

/**
 * Build full magic link URL
 */
export function getMagicLinkUrl(token: string): string {
    const baseUrl = process.env.MAGIC_LINK_BASE_URL ||
        process.env.RAILWAY_PUBLIC_DOMAIN ?
        `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` :
        'http://localhost:3000';

    return `${baseUrl}/auth/magic/${token}`;
}

/**
 * Invalidate a magic link (optional - for security)
 */
export async function invalidateMagicLink(tokenHash: string): Promise<void> {
    // Remove from Redis
    await redisStore.del(MAGIC_LINK_PREFIX + tokenHash);

    // Mark as invalid in PostgreSQL
    if (isDatabaseAvailable()) {
        try {
            await query(
                `UPDATE magic_links SET is_valid = false WHERE token = $1`,
                [tokenHash]
            );
        } catch (error) {
            logger.error('Failed to invalidate magic link', error instanceof Error ? error : new Error(String(error)));
        }
    }

    logger.info('Magic link invalidated', { tokenHash: tokenHash.substring(0, 8) + '...' });
}

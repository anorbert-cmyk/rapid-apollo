// ===========================================
// SOLUTION REPOSITORY - Database operations for solutions
// ===========================================

import { query, queryOne, isDatabaseAvailable } from './index';
import { SolutionResponse, SolutionSections } from '../types/solution';
import { logger } from '../utils/logger';
import { encrypt, decrypt, encryptJson, decryptJson, isEncryptionEnabled, hash } from '../utils/encryption';

export interface StoredSolution {
    id: number;
    txHash: string;
    walletAddress: string;
    tier: 'standard' | 'medium' | 'full';
    problemStatement: string;
    sections: SolutionSections;
    rawMarkdown: string | null;
    provider: string;
    createdAt: Date;
}

/**
 * Save a solution to the database
 */
export async function saveSolution(
    txHash: string,
    walletAddress: string,
    tier: string,
    problemStatement: string,
    response: SolutionResponse
): Promise<StoredSolution | null> {
    if (!isDatabaseAvailable()) {
        logger.debug('Database not available, skipping saveSolution');
        return null;
    }

    try {
        // Encrypt sensitive fields
        const encryptedProblem = encrypt(problemStatement);
        const encryptedSections = encryptJson(response.sections);
        const encryptedMarkdown = response.rawMarkdown ? encrypt(response.rawMarkdown) : null;
        const encryptedWallet = encrypt(walletAddress.toLowerCase());
        // Hash for searchable lookups
        const walletHash = hash(walletAddress.toLowerCase());

        if (isEncryptionEnabled()) {
            logger.debug('Saving solution with encryption enabled');
        }

        const result = await queryOne<any>(
            `INSERT INTO solutions (tx_hash, wallet_address, wallet_hash, tier, problem_statement, sections, raw_markdown, provider)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (tx_hash) DO NOTHING
             RETURNING *`,
            [
                txHash,
                encryptedWallet,
                walletHash,
                tier,
                encryptedProblem,
                encryptedSections,
                encryptedMarkdown,
                response.meta.provider
            ]
        );

        if (result) {
            logger.info('Solution saved to database', { txHash });
            return mapToStoredSolution(result);
        }

        return null;

    } catch (error) {
        logger.error('Failed to save solution', error as Error);
        return null;
    }
}

/**
 * Get all solutions for a wallet address
 */
export async function getSolutionsByWallet(
    walletAddress: string,
    limit: number = 50
): Promise<StoredSolution[]> {
    if (!isDatabaseAvailable()) {
        return [];
    }

    try {
        // Hash for encryption-compatible lookup
        const walletHash = hash(walletAddress.toLowerCase());

        // Search by wallet_hash (new encrypted) OR by wallet_address (legacy)
        const rows = await query<any>(
            `SELECT * FROM solutions 
             WHERE (wallet_hash = $1 OR wallet_address = $2)
             ORDER BY created_at DESC 
             LIMIT $3`,
            [walletHash, walletAddress.toLowerCase(), limit]
        );

        return rows.map(mapToStoredSolution);

    } catch (error) {
        logger.error('Failed to get solutions by wallet', error as Error);
        return [];
    }
}

/**
 * Get a single solution by txHash
 */
export async function getSolutionByTxHash(
    txHash: string
): Promise<StoredSolution | null> {
    if (!isDatabaseAvailable()) {
        return null;
    }

    try {
        const result = await queryOne<any>(
            `SELECT * FROM solutions WHERE tx_hash = $1`,
            [txHash]
        );

        return result ? mapToStoredSolution(result) : null;

    } catch (error) {
        logger.error('Failed to get solution by txHash', error as Error);
        return null;
    }
}

/**
 * Check if txHash exists (for double-spend prevention)
 */
export async function isTxHashUsed(txHash: string): Promise<boolean> {
    if (!isDatabaseAvailable()) {
        return false; // Fall back to in-memory check
    }

    try {
        const result = await queryOne<any>(
            `SELECT 1 FROM used_tx_hashes WHERE tx_hash = $1`,
            [txHash]
        );

        return result !== null;

    } catch (error) {
        logger.error('Failed to check txHash', error as Error);
        return false;
    }
}

/**
 * Mark txHash as used
 */
export async function markTxHashUsed(txHash: string): Promise<boolean> {
    if (!isDatabaseAvailable()) {
        return false;
    }

    try {
        await query(
            `INSERT INTO used_tx_hashes (tx_hash) VALUES ($1) ON CONFLICT DO NOTHING`,
            [txHash]
        );
        return true;

    } catch (error) {
        logger.error('Failed to mark txHash as used', error as Error);
        return false;
    }
}

/**
 * Log transaction for admin
 */
export async function logTransaction(
    txHash: string,
    walletAddress: string,
    tier: string
): Promise<void> {
    if (!isDatabaseAvailable()) {
        return;
    }

    try {
        await query(
            `INSERT INTO transaction_log (tx_hash, wallet_address, tier) VALUES ($1, $2, $3)`,
            [txHash, walletAddress.toLowerCase(), tier]
        );
    } catch (error) {
        logger.error('Failed to log transaction', error as Error);
    }
}

/**
 * Update stats (atomic transaction)
 */
export async function updateStats(tier: string, ethAmount: number): Promise<void> {
    if (!isDatabaseAvailable()) {
        return;
    }

    try {
        // Use raw SQL transaction for atomicity (single query)
        await query(
            `BEGIN;
             UPDATE stats SET value = value + 1, updated_at = NOW() WHERE key = 'total_solves';
             UPDATE stats SET value = value + 1, updated_at = NOW() WHERE key = $1;
             UPDATE stats SET value = value + $2, updated_at = NOW() WHERE key = 'total_revenue_eth';
             COMMIT;`,
            [`count_${tier}`, ethAmount]
        );

    } catch (error) {
        logger.error('Failed to update stats', error as Error);
    }
}

/**
 * Get stats for admin
 */
export async function getStats(): Promise<Record<string, number>> {
    if (!isDatabaseAvailable()) {
        return {};
    }

    try {
        const rows = await query<{ key: string; value: string }>(
            `SELECT key, value FROM stats`
        );

        return rows.reduce((acc, row) => {
            acc[row.key] = parseFloat(row.value);
            return acc;
        }, {} as Record<string, number>);

    } catch (error) {
        logger.error('Failed to get stats', error as Error);
        return {};
    }
}

/**
 * Get transaction log for admin
 */
export async function getTransactionLog(
    limit: number = 100
): Promise<any[]> {
    if (!isDatabaseAvailable()) {
        return [];
    }

    try {
        return await query(
            `SELECT tx_hash, wallet_address, tier, created_at 
             FROM transaction_log 
             ORDER BY created_at DESC 
             LIMIT $1`,
            [limit]
        );
    } catch (error) {
        logger.error('Failed to get transaction log', error as Error);
        return [];
    }
}

// Helper to map DB rows to StoredSolution (with decryption)
function mapToStoredSolution(row: any): StoredSolution {
    // Decrypt sensitive fields
    const decryptedProblem = decrypt(row.problem_statement);
    const decryptedWallet = decrypt(row.wallet_address);
    const decryptedMarkdown = row.raw_markdown ? decrypt(row.raw_markdown) : null;

    // Handle sections - could be encrypted string or already parsed JSONB
    let decryptedSections: SolutionSections;
    if (typeof row.sections === 'string') {
        // Try to decrypt if it's an encrypted string
        if (row.sections.startsWith('ENC:')) {
            decryptedSections = decryptJson<SolutionSections>(row.sections) || {} as SolutionSections;
        } else {
            // Try parsing as JSON
            try {
                decryptedSections = JSON.parse(row.sections);
            } catch {
                decryptedSections = {} as SolutionSections;
            }
        }
    } else {
        // Already parsed by PostgreSQL JSONB
        decryptedSections = row.sections || {};
    }

    return {
        id: row.id,
        txHash: row.tx_hash,
        walletAddress: decryptedWallet,
        tier: row.tier,
        problemStatement: decryptedProblem,
        sections: decryptedSections,
        rawMarkdown: decryptedMarkdown,
        provider: row.provider,
        createdAt: new Date(row.created_at)
    };
}

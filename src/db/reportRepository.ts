// ===========================================
// REPORT REPOSITORY - Database operations for reports
// ===========================================

import { query, queryOne, isDatabaseAvailable } from './index';
import { logger } from '../utils/logger';
import {
    StoredReport,
    ReportStatus,
    ReportPackage,
    PerplexityUsage,
    ParsedSections,
    FigmaPrompts
} from '../types/report';

// ===========================================
// CREATE
// ===========================================

/**
 * Create a new report record
 */
export async function createReport(data: {
    walletAddress: string;
    problemStatement: string;
    package: ReportPackage;
    txHash?: string;
    stripeSessionId?: string;
}): Promise<StoredReport | null> {
    if (!isDatabaseAvailable()) {
        logger.warn('Database not available, cannot create report');
        return null;
    }

    try {
        const result = await queryOne<any>(
            `INSERT INTO reports (wallet_address, problem_statement, package, tx_hash, stripe_session_id, status, progress)
             VALUES ($1, $2, $3, $4, $5, 'queued', 0)
             RETURNING *`,
            [
                data.walletAddress.toLowerCase(),
                data.problemStatement,
                data.package,
                data.txHash || null,
                data.stripeSessionId || null
            ]
        );

        if (result) {
            logger.info('Report created', { reportId: result.id });
            return mapToStoredReport(result);
        }

        return null;
    } catch (error) {
        logger.error('Failed to create report', error as Error);
        return null;
    }
}

// ===========================================
// UPDATE
// ===========================================

/**
 * Update report status and progress
 */
export async function updateReportStatus(
    reportId: string,
    status: ReportStatus,
    progress: number,
    options?: {
        errorMessage?: string;
        startedAt?: boolean;
        completedAt?: boolean;
    }
): Promise<boolean> {
    if (!isDatabaseAvailable()) {
        return false;
    }

    try {
        let sql = `UPDATE reports SET status = $1, progress = $2`;
        const params: any[] = [status, progress];
        let paramIndex = 3;

        if (options?.errorMessage !== undefined) {
            sql += `, error_message = $${paramIndex++}`;
            params.push(options.errorMessage);
        }

        if (options?.startedAt) {
            sql += `, started_at = NOW()`;
        }

        if (options?.completedAt) {
            sql += `, completed_at = NOW()`;
        }

        sql += ` WHERE id = $${paramIndex}`;
        params.push(reportId);

        await query(sql, params);

        logger.debug('Report status updated', { reportId, status, progress });
        return true;
    } catch (error) {
        logger.error('Failed to update report status', error as Error);
        return false;
    }
}

/**
 * Save analysis results (partial - for crash recovery)
 */
export async function saveAnalysisResult(
    reportId: string,
    analysisMarkdown: string,
    parsedSections: ParsedSections,
    usage: PerplexityUsage
): Promise<boolean> {
    if (!isDatabaseAvailable()) {
        return false;
    }

    try {
        await query(
            `UPDATE reports 
             SET analysis_markdown = $1, 
                 parsed_sections = $2, 
                 perplexity_usage = $3,
                 processing_time_ms = $4
             WHERE id = $5`,
            [
                analysisMarkdown,
                JSON.stringify(parsedSections),
                JSON.stringify(usage),
                usage.processingTimeMs,
                reportId
            ]
        );

        logger.info('Analysis result saved', { reportId });
        return true;
    } catch (error) {
        logger.error('Failed to save analysis result', error as Error);
        return false;
    }
}

/**
 * Save Figma prompts
 */
export async function saveFigmaPrompts(
    reportId: string,
    figmaPrompts: FigmaPrompts,
    additionalUsage?: PerplexityUsage
): Promise<boolean> {
    if (!isDatabaseAvailable()) {
        return false;
    }

    try {
        // Merge usage if provided
        let usageUpdateSql = '';
        const params: any[] = [JSON.stringify(figmaPrompts), reportId];

        if (additionalUsage) {
            usageUpdateSql = `, perplexity_usage = perplexity_usage || $3::jsonb`;
            params.splice(1, 0, JSON.stringify(additionalUsage));
        }

        await query(
            `UPDATE reports 
             SET figma_prompts = $1 ${usageUpdateSql}
             WHERE id = $${params.length}`,
            params
        );

        logger.info('Figma prompts saved', { reportId });
        return true;
    } catch (error) {
        logger.error('Failed to save Figma prompts', error as Error);
        return false;
    }
}

// ===========================================
// READ
// ===========================================

/**
 * Get report by ID
 */
export async function getReportById(reportId: string): Promise<StoredReport | null> {
    if (!isDatabaseAvailable()) {
        return null;
    }

    try {
        const result = await queryOne<any>(
            `SELECT * FROM reports WHERE id = $1`,
            [reportId]
        );

        return result ? mapToStoredReport(result) : null;
    } catch (error) {
        logger.error('Failed to get report by ID', error as Error);
        return null;
    }
}

/**
 * Get reports by wallet address
 */
export async function getReportsByWallet(
    walletAddress: string,
    limit: number = 20
): Promise<StoredReport[]> {
    if (!isDatabaseAvailable()) {
        return [];
    }

    try {
        const rows = await query<any>(
            `SELECT * FROM reports 
             WHERE wallet_address = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [walletAddress.toLowerCase(), limit]
        );

        return rows.map(mapToStoredReport);
    } catch (error) {
        logger.error('Failed to get reports by wallet', error as Error);
        return [];
    }
}

/**
 * Get report by transaction hash (for payment verification)
 */
export async function getReportByTxHash(txHash: string): Promise<StoredReport | null> {
    if (!isDatabaseAvailable()) {
        return null;
    }

    try {
        const result = await queryOne<any>(
            `SELECT * FROM reports WHERE tx_hash = $1`,
            [txHash]
        );

        return result ? mapToStoredReport(result) : null;
    } catch (error) {
        logger.error('Failed to get report by txHash', error as Error);
        return null;
    }
}

/**
 * Check if wallet has reached rate limit
 */
export async function checkReportRateLimit(
    walletAddress: string,
    maxPerHour: number
): Promise<{ allowed: boolean; count: number }> {
    if (!isDatabaseAvailable()) {
        // SECURITY: Fail closed - don't allow if we can't check rate limit
        logger.warn('Rate limit check failed - database unavailable');
        return { allowed: false, count: -1 };
    }

    try {
        const result = await queryOne<{ count: string }>(
            `SELECT COUNT(*) as count FROM reports 
             WHERE wallet_address = $1 
             AND created_at > NOW() - INTERVAL '1 hour'`,
            [walletAddress.toLowerCase()]
        );

        const count = parseInt(result?.count || '0', 10);
        return {
            allowed: count < maxPerHour,
            count
        };
    } catch (error) {
        logger.error('Failed to check rate limit', error as Error);
        // SECURITY: Fail closed on errors
        return { allowed: false, count: -1 };
    }
}

// ===========================================
// STATS
// ===========================================

/**
 * Get report statistics
 */
export async function getReportStats(): Promise<{
    total: number;
    completed: number;
    failed: number;
    avgProcessingTime: number;
    totalCost: number;
}> {
    if (!isDatabaseAvailable()) {
        return { total: 0, completed: 0, failed: 0, avgProcessingTime: 0, totalCost: 0 };
    }

    try {
        const result = await queryOne<any>(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) FILTER (WHERE status = 'failed') as failed,
                AVG(processing_time_ms) FILTER (WHERE status = 'completed') as avg_time,
                SUM((perplexity_usage->>'estimatedCost')::numeric) FILTER (WHERE status = 'completed') as total_cost
            FROM reports
        `);

        return {
            total: parseInt(result?.total || '0', 10),
            completed: parseInt(result?.completed || '0', 10),
            failed: parseInt(result?.failed || '0', 10),
            avgProcessingTime: Math.round(parseFloat(result?.avg_time || '0')),
            totalCost: Math.round(parseFloat(result?.total_cost || '0') * 100) / 100
        };
    } catch (error) {
        logger.error('Failed to get report stats', error as Error);
        return { total: 0, completed: 0, failed: 0, avgProcessingTime: 0, totalCost: 0 };
    }
}

// ===========================================
// HELPERS
// ===========================================

function mapToStoredReport(row: any): StoredReport {
    return {
        id: row.id,
        walletAddress: row.wallet_address,
        problemStatement: row.problem_statement,
        package: row.package as ReportPackage,
        status: row.status as ReportStatus,
        progress: row.progress || 0,
        analysisMarkdown: row.analysis_markdown,
        figmaPrompts: row.figma_prompts ? (typeof row.figma_prompts === 'string' ? JSON.parse(row.figma_prompts) : row.figma_prompts) : undefined,
        parsedSections: row.parsed_sections ? (typeof row.parsed_sections === 'string' ? JSON.parse(row.parsed_sections) : row.parsed_sections) : undefined,
        perplexityUsage: row.perplexity_usage ? (typeof row.perplexity_usage === 'string' ? JSON.parse(row.perplexity_usage) : row.perplexity_usage) : undefined,
        processingTimeMs: row.processing_time_ms,
        errorMessage: row.error_message,
        txHash: row.tx_hash,
        stripeSessionId: row.stripe_session_id,
        createdAt: new Date(row.created_at),
        startedAt: row.started_at ? new Date(row.started_at) : undefined,
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined
    };
}

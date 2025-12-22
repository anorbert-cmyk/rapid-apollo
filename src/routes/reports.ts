// ===========================================
// REPORT ROUTES - API Endpoints for Report Generation
// ===========================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { verifyMessage } from 'ethers';
import { logger } from '../utils/logger';
import { CONSTANTS } from '../constants';
import { checkAndMarkSignatureAsync } from '../utils/signatureStore';
import { queueReportGeneration, getJobStatus, getQueueMetrics } from '../lib/queue';
import * as reportRepo from '../db/reportRepository';
import { isPerplexityConfigured, getPerplexityHealth } from '../services/perplexityService';
import { ReportPackage, GenerateReportResponse, ReportResponse } from '../types/report';
import { verifyTransaction } from '../services/paymentService';
import { Tier } from '../services/priceService';
import { usedTxHashes } from '../store';

const router = Router();

// ===========================================
// PROMPT INJECTION PATTERNS (from aiService)
// ===========================================

const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|rules?|prompts?)/gi,
    /disregard\s+(all\s+)?(previous|above|prior)/gi,
    /forget\s+(everything|all|your)\s+(instructions?|rules?|training)/gi,
    /you\s+are\s+(now|actually|really)\s+(?!analyzing|helping)/gi,
    /act\s+as\s+(?!a\s+helpful)/gi,
    /pretend\s+(to\s+be|you('re)?)/gi,
    /roleplay\s+as/gi,
    /switch\s+to\s+.*\s+mode/gi,
    /what\s+(are|is)\s+your\s+(system\s+)?prompt/gi,
    /show\s+(me\s+)?your\s+(instructions?|prompt|rules)/gi,
    /reveal\s+(your\s+)?(hidden\s+)?instructions?/gi,
    /DAN\s*mode/gi,
    /developer\s+mode/gi,
    /sudo\s+mode/gi,
    /\[JAILBREAK\]/gi,
    /bypass\s+(safety|filter|restriction)/gi,
    /<script[\s>]/gi,
];

/**
 * Sanitize user input to prevent prompt injection
 */
function sanitizeProblemStatement(input: string): { sanitized: string; flagged: boolean } {
    let sanitized = input.trim();
    let flagged = false;

    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(sanitized)) {
            sanitized = sanitized.replace(pattern, '[FILTERED]');
            flagged = true;
        }
    }

    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');

    return { sanitized, flagged };
}

// ===========================================
// REQUEST VALIDATION SCHEMAS
// ===========================================

const generateReportSchema = z.object({
    problemStatement: z.string()
        .min(CONSTANTS.MIN_PROBLEM_LENGTH, `Problem statement must be at least ${CONSTANTS.MIN_PROBLEM_LENGTH} characters`)
        .max(CONSTANTS.MAX_PROBLEM_LENGTH, `Problem statement must be at most ${CONSTANTS.MAX_PROBLEM_LENGTH} characters`),
    package: z.enum(['premium', 'premium_figma']).default('premium'),
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
    signature: z.string().min(1, 'Signature is required'),
    timestamp: z.number().int().positive(),
    email: z.string().email('Invalid email address').optional(),
    txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
    stripeSessionId: z.string().optional()
});

// UUID validation for path params
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ===========================================
// POST /api/v1/reports/generate
// Start a new report generation
// ===========================================

router.post('/generate', async (req: Request, res: Response) => {
    try {
        // 1. VALIDATE INPUT
        const parseResult = generateReportSchema.safeParse(req.body);
        if (!parseResult.success) {
            const errors = parseResult.error.issues.map(e => e.message).join(', ');
            return res.status(400).json({ error: `Validation failed: ${errors}` });
        }

        const {
            problemStatement,
            package: reportPackage,
            walletAddress,
            signature,
            timestamp,
            email,
            txHash,
            stripeSessionId
        } = parseResult.data;

        // 2. CHECK PERPLEXITY AVAILABILITY
        if (!isPerplexityConfigured()) {
            return res.status(503).json({
                error: 'Premium report generation is temporarily unavailable',
                code: 'SERVICE_UNAVAILABLE'
            });
        }

        // 3. VERIFY TIMESTAMP (prevent replay attacks)
        const now = Date.now();
        if (Math.abs(now - timestamp) > CONSTANTS.SIGNATURE_VALIDITY_MS) {
            logger.warn('Expired timestamp on report generation', { wallet: walletAddress });
            return res.status(403).json({ error: 'Request expired. Please try again.' });
        }

        // 4. VERIFY SIGNATURE
        const message = `Generate Premium Report at ${timestamp}`;
        let recoveredAddress: string;

        try {
            recoveredAddress = verifyMessage(message, signature);
        } catch {
            return res.status(403).json({ error: 'Invalid signature format' });
        }

        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(403).json({ error: 'Invalid signature' });
        }

        // 5. PREVENT SIGNATURE REPLAY
        const isValidSignature = await checkAndMarkSignatureAsync(signature, walletAddress);
        if (!isValidSignature) {
            logger.warn('Signature replay attempt on report generation', { wallet: walletAddress });
            return res.status(403).json({ error: 'Signature already used. Please sign again.' });
        }

        // 6. CHECK RATE LIMIT
        const rateLimit = await reportRepo.checkReportRateLimit(
            walletAddress,
            CONSTANTS.REPORT_RATE_LIMIT_PER_HOUR
        );

        if (!rateLimit.allowed) {
            logger.warn('Rate limit exceeded for reports', {
                wallet: walletAddress,
                count: rateLimit.count
            });
            return res.status(429).json({
                error: `Rate limit exceeded. Maximum ${CONSTANTS.REPORT_RATE_LIMIT_PER_HOUR} reports per hour.`,
                retryAfter: 3600
            });
        }

        // 7. VERIFY PAYMENT
        let paymentFrom: string | undefined;

        if (txHash) {
            // Check for txHash double-spend
            const existingTx = await usedTxHashes.get(txHash);
            if (existingTx) {
                logger.warn('txHash already used for report', { txHash, wallet: walletAddress });
                return res.status(409).json({
                    error: 'Transaction already used for a previous report',
                    code: 'TX_ALREADY_USED'
                });
            }

            // Verify the payment on-chain
            const payment = await verifyTransaction(txHash, 'premium' as Tier);
            if (!payment.valid) {
                logger.warn('Payment verification failed', { txHash, message: payment.message });
                return res.status(402).json({
                    error: payment.message || 'Payment verification failed',
                    code: 'PAYMENT_INVALID'
                });
            }

            paymentFrom = payment.from;

            // Mark txHash as used (atomic with Redis)
            await usedTxHashes.set(txHash, Date.now() as any);
        } else if (stripeSessionId) {
            // TODO: Verify Stripe session
            // For now, accept Stripe sessions (Stripe webhook should have already verified)
            logger.info('Stripe session provided', { stripeSessionId });
        } else {
            return res.status(402).json({
                error: 'Payment required. Provide txHash or stripeSessionId.',
                code: 'PAYMENT_REQUIRED'
            });
        }

        // 8. SANITIZE PROBLEM STATEMENT
        const { sanitized: sanitizedProblem, flagged } = sanitizeProblemStatement(problemStatement);
        if (flagged) {
            logger.warn('Potential prompt injection detected', { wallet: walletAddress });
        }

        // 8. CREATE REPORT RECORD
        const report = await reportRepo.createReport({
            walletAddress,
            problemStatement,
            package: reportPackage as ReportPackage,
            txHash,
            stripeSessionId
        });

        if (!report) {
            return res.status(500).json({ error: 'Failed to create report record' });
        }

        // 9. QUEUE GENERATION JOB
        try {
            await queueReportGeneration({
                reportId: report.id,
                walletAddress,
                problemStatement: sanitizedProblem,
                package: reportPackage as ReportPackage,
                email,  // Pass email for magic link sending after completion
                userContext: {
                    language: req.headers['accept-language']?.split(',')[0] || 'en'
                }
            });
        } catch (queueError: any) {
            logger.error('Failed to queue report generation', queueError);
            // Mark report as failed
            await reportRepo.updateReportStatus(report.id, 'failed', 0, {
                errorMessage: 'Failed to queue generation'
            });
            return res.status(500).json({ error: 'Failed to start report generation' });
        }

        // 10. RETURN SUCCESS
        const response: GenerateReportResponse = {
            success: true,
            reportId: report.id,
            status: 'queued',
            statusUrl: `/api/v1/reports/${report.id}/status`,
            estimatedTime: '3-5 minutes'
        };

        logger.info('Report generation queued', {
            reportId: report.id,
            wallet: walletAddress,
            package: reportPackage
        });

        return res.status(202).json(response);

    } catch (error) {
        logger.error('Report generation endpoint error', error as Error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ===========================================
// GET /api/v1/reports/:id/status
// Poll for report generation status
// ===========================================

router.get('/:id/status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Validate UUID format
        if (!UUID_REGEX.test(id)) {
            return res.status(400).json({ error: 'Invalid report ID format' });
        }

        // Get report from database
        const report = await reportRepo.getReportById(id);

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // Calculate estimated time remaining
        let estimatedTimeRemaining: string | undefined;
        if (report.status !== 'completed' && report.status !== 'failed') {
            const elapsed = Date.now() - report.createdAt.getTime();
            const remaining = Math.max(0, CONSTANTS.REPORT_MAX_PROCESSING_TIME - elapsed);
            estimatedTimeRemaining = `${Math.ceil(remaining / 1000)}s`;
        }

        // Sanitize error messages for client (no stack traces)
        const sanitizedError = report.status === 'failed' && report.errorMessage
            ? report.errorMessage.replace(/at\s+.*/g, '').substring(0, 200)
            : undefined;

        return res.json({
            reportId: report.id,
            status: report.status,
            progress: report.progress,
            estimatedTimeRemaining,
            createdAt: report.createdAt.toISOString(),
            startedAt: report.startedAt?.toISOString(),
            completedAt: report.completedAt?.toISOString(),
            errorMessage: sanitizedError,
            viewUrl: report.status === 'completed' ? `/api/v1/reports/${report.id}` : undefined
        });

    } catch (error) {
        logger.error('Report status endpoint error', error as Error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ===========================================
// GET /api/v1/reports/:id
// Get completed report
// ===========================================

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Validate UUID format
        if (!UUID_REGEX.test(id)) {
            return res.status(400).json({ error: 'Invalid report ID format' });
        }

        const report = await reportRepo.getReportById(id);

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // IDOR Protection: Optionally require wallet signature for accessing report content
        // For now, we allow access without auth since report IDs are UUIDs (hard to guess)
        // In future, consider adding wallet verification for extra security

        // Only return full content if completed
        if (report.status !== 'completed') {
            return res.status(202).json({
                reportId: report.id,
                status: report.status,
                progress: report.progress,
                message: 'Report is still processing',
                statusUrl: `/api/v1/reports/${report.id}/status`
            });
        }

        const response: ReportResponse = {
            id: report.id,
            status: report.status,
            progress: report.progress,
            package: report.package,
            analysisMarkdown: report.analysisMarkdown,
            parsedSections: report.parsedSections,
            figmaPrompts: report.figmaPrompts,
            createdAt: report.createdAt.toISOString(),
            completedAt: report.completedAt?.toISOString(),
            processingTimeMs: report.processingTimeMs
        };

        return res.json(response);

    } catch (error) {
        logger.error('Report get endpoint error', error as Error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ===========================================
// GET /api/v1/reports
// List user's reports (requires auth)
// ===========================================

router.get('/', async (req: Request, res: Response) => {
    try {
        const { walletAddress, signature, timestamp } = req.query;

        // Validate query params
        if (!walletAddress || !signature || !timestamp) {
            return res.status(400).json({ error: 'Missing authentication parameters' });
        }

        // Verify timestamp
        const ts = parseInt(timestamp as string, 10);
        if (Math.abs(Date.now() - ts) > CONSTANTS.SIGNATURE_VALIDITY_MS) {
            return res.status(403).json({ error: 'Request expired' });
        }

        // Verify signature
        const message = `List Reports at ${timestamp}`;
        const recovered = verifyMessage(message, signature as string);

        if (recovered.toLowerCase() !== (walletAddress as string).toLowerCase()) {
            return res.status(403).json({ error: 'Invalid signature' });
        }

        // Get reports
        const reports = await reportRepo.getReportsByWallet(walletAddress as string);

        return res.json({
            success: true,
            count: reports.length,
            reports: reports.map(r => ({
                id: r.id,
                status: r.status,
                progress: r.progress,
                package: r.package,
                problemStatement: r.problemStatement.substring(0, 200) + '...',
                createdAt: r.createdAt.toISOString(),
                completedAt: r.completedAt?.toISOString()
            }))
        });

    } catch (error) {
        logger.error('Report list endpoint error', error as Error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ===========================================
// GET /api/v1/reports/health
// Report service health check
// ===========================================

router.get('/health', async (_req: Request, res: Response) => {
    try {
        const perplexityHealth = getPerplexityHealth();
        const queueMetrics = await getQueueMetrics();

        return res.json({
            status: 'ok',
            perplexity: perplexityHealth,
            queue: queueMetrics
        });

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            error: (error as Error).message
        });
    }
});

export default router;

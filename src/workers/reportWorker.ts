// ===========================================
// REPORT WORKER - Background Job Processor
// ===========================================

import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../lib/queue';
import { CONSTANTS } from '../constants';
import { logger } from '../utils/logger';
import { ReportJobData, ReportStatus } from '../types/report';
import {
    generateAnalysis,
    generateFigmaPrompts,
    validateSections,
    getPerplexityHealth
} from '../services/perplexityService';
import * as reportRepo from '../db/reportRepository';
import { createMagicLink, getMagicLinkUrl } from '../services/magicLinkService';
import { sendPremiumReportEmail, isEmailConfigured } from '../services/emailService';

// ===========================================
// WORKER CONFIGURATION
// ===========================================

let worker: Worker<ReportJobData> | null = null;

/**
 * Start the report generation worker
 */
export function startReportWorker(): Worker<ReportJobData> {
    if (worker) {
        logger.warn('Report worker already running');
        return worker;
    }

    const connection = getRedisConnection();

    worker = new Worker<ReportJobData>(
        CONSTANTS.REPORT_QUEUE_NAME,
        processReportJob,
        {
            connection,
            concurrency: CONSTANTS.REPORT_WORKER_CONCURRENCY,
            limiter: {
                max: CONSTANTS.REPORT_WORKER_LIMITER_MAX,
                duration: CONSTANTS.REPORT_WORKER_LIMITER_DURATION
            }
        }
    );

    // Event handlers
    worker.on('completed', (job) => {
        const duration = job.finishedOn && job.processedOn
            ? job.finishedOn - job.processedOn
            : 0;

        logger.info('Report job completed', {
            jobId: job.id,
            reportId: job.data.reportId,
            durationMs: duration
        });
    });

    worker.on('failed', (job, err) => {
        logger.error('Report job failed', new Error(`Job ${job?.id} failed: ${err.message}`));
    });

    worker.on('error', (err) => {
        logger.error('Report worker error', err);
    });

    worker.on('stalled', (jobId) => {
        logger.warn('Report job stalled', { jobId });
    });

    logger.info('Report worker started', {
        concurrency: CONSTANTS.REPORT_WORKER_CONCURRENCY,
        queueName: CONSTANTS.REPORT_QUEUE_NAME
    });

    return worker;
}

/**
 * Stop the report worker gracefully
 */
export async function stopReportWorker(): Promise<void> {
    if (worker) {
        await worker.close();
        worker = null;
        logger.info('Report worker stopped');
    }
}

// ===========================================
// JOB PROCESSOR
// ===========================================

/**
 * Main job processing function
 * Implements stepped generation with crash recovery
 */
async function processReportJob(job: Job<ReportJobData>): Promise<{ success: boolean; reportId: string }> {
    const { reportId, problemStatement, package: reportPackage, userContext, walletAddress, email } = job.data;

    logger.info('Processing report job', {
        jobId: job.id,
        reportId,
        package: reportPackage
    });

    try {
        // ===========================================
        // STEP 1: MARK AS STARTED (10%)
        // ===========================================
        await job.updateProgress(10);
        await reportRepo.updateReportStatus(reportId, 'analysis', 10, { startedAt: true });

        // Check Perplexity health before starting
        const health = getPerplexityHealth();
        if (!health.configured) {
            throw new Error('Perplexity API is not configured');
        }

        if (health.circuitState === 'OPEN') {
            throw new Error('Perplexity API circuit breaker is OPEN - service temporarily unavailable');
        }

        // ===========================================
        // STEP 2: GENERATE ANALYSIS (10% -> 60%)
        // ===========================================
        logger.info('Starting analysis generation', { reportId });

        const analysisResult = await generateAnalysis(problemStatement, userContext);

        // Save partial result immediately (crash recovery)
        await reportRepo.saveAnalysisResult(
            reportId,
            analysisResult.markdown,
            analysisResult.parsedSections,
            analysisResult.usage
        );

        await job.updateProgress(60);
        await reportRepo.updateReportStatus(reportId, 'validation', 60);

        logger.info('Analysis completed', {
            reportId,
            tokensUsed: analysisResult.usage.totalTokens,
            sectionsFound: analysisResult.validation.foundSections
        });

        // ===========================================
        // STEP 3: VALIDATE SECTIONS (60% -> 70%)
        // ===========================================
        const validation = analysisResult.validation;

        if (!validation.isComplete) {
            logger.warn('Analysis incomplete, missing sections', {
                reportId,
                missingSections: validation.missingSections,
                foundSections: validation.foundSections
            });

            // For now, we continue even if incomplete
            // In future, could regenerate missing sections
        }

        await job.updateProgress(70);

        // ===========================================
        // STEP 4: GENERATE FIGMA (if included) (70% -> 95%)
        // ===========================================
        if (reportPackage === 'premium_figma') {
            await reportRepo.updateReportStatus(reportId, 'figma', 70);

            logger.info('Starting Figma prompt generation', { reportId });

            // Use executive summary + screen specs as context
            const figmaContext = [
                analysisResult.parsedSections.section0_executiveSummary || '',
                analysisResult.parsedSections.section5_screenSpecs || '',
                analysisResult.parsedSections.section9_designAudit || ''
            ].join('\n\n');

            const figmaResult = await generateFigmaPrompts(figmaContext);

            // Save Figma prompts
            await reportRepo.saveFigmaPrompts(reportId, figmaResult.prompts, figmaResult.usage);

            logger.info('Figma prompts completed', {
                reportId,
                hasPromptA: !!figmaResult.prompts.promptA_happyPath,
                hasPromptB: !!figmaResult.prompts.promptB_errorRecovery,
                hasPromptC: !!figmaResult.prompts.promptC_componentLibrary
            });
        }

        await job.updateProgress(95);

        // ===========================================
        // STEP 5: MARK COMPLETE (95% -> 100%)
        // ===========================================
        await reportRepo.updateReportStatus(reportId, 'completed', 100, { completedAt: true });
        await job.updateProgress(100);

        logger.info('Report generation completed', {
            reportId,
            totalTokens: analysisResult.usage.totalTokens,
            estimatedCost: analysisResult.usage.estimatedCost,
            processingTimeMs: analysisResult.usage.processingTimeMs,
            package: reportPackage
        });

        // ===========================================
        // STEP 6: SEND MAGIC LINK EMAIL (if email provided)
        // ===========================================
        if (email && isEmailConfigured()) {
            try {
                const magicToken = await createMagicLink(
                    email,
                    reportId,
                    'premium',
                    problemStatement.substring(0, 200),
                    'completed'
                );
                const magicLinkUrl = getMagicLinkUrl(magicToken);

                await sendPremiumReportEmail({
                    to: email,
                    magicLink: magicLinkUrl,
                    reportPackage,
                    problemSummary: problemStatement
                });

                logger.info('Premium report email sent', {
                    reportId,
                    email: email.substring(0, 3) + '***'
                });
            } catch (emailError: any) {
                logger.error('Failed to send premium report email', new Error(emailError.message));
                // Don't fail the job if email fails
            }
        }

        return { success: true, reportId };

    } catch (error: any) {
        logger.error('Report generation failed', new Error(`Report ${reportId}: ${error.message}`));

        // Update status to failed
        await reportRepo.updateReportStatus(
            reportId,
            'failed',
            0,
            { errorMessage: error.message }
        );

        // Re-throw for BullMQ retry logic
        throw error;
    }
}

// ===========================================
// STANDALONE EXECUTION
// ===========================================

// If this file is run directly, start the worker
if (require.main === module) {
    (async () => {
        logger.info('Starting report worker in standalone mode');

        // Initialize database if available
        if (process.env.DATABASE_URL) {
            try {
                const { initDatabase, runMigrations } = await import('../db');
                initDatabase();
                await runMigrations();
                logger.info('Database initialized for worker');
            } catch (error) {
                logger.error('Database initialization failed for worker', error as Error);
            }
        }

        // Start worker
        startReportWorker();

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            logger.info('Worker shutdown signal received', { signal });
            await stopReportWorker();
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    })();
}

// ===========================================
// BULLMQ QUEUE - Report Generation Queue
// ===========================================

import { Queue, QueueEvents, Job } from 'bullmq';
import Redis from 'ioredis';
import { CONSTANTS } from '../constants';
import { logger } from '../utils/logger';
import { ReportJobData } from '../types/report';

// ===========================================
// REDIS CONNECTION
// ===========================================

let redisConnection: Redis | null = null;

/**
 * Get or create Redis connection for BullMQ
 * Reuses the existing REDIS_URL from the environment
 */
export function getRedisConnection(): Redis {
    if (!redisConnection) {
        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
            throw new Error('REDIS_URL is required for report generation queue');
        }

        redisConnection = new Redis(redisUrl, {
            maxRetriesPerRequest: null, // Required for BullMQ
            enableReadyCheck: false,
            retryStrategy: (times) => {
                if (times > 10) {
                    logger.error('Redis connection failed after 10 retries');
                    return null; // Stop retrying
                }
                return Math.min(times * 100, 3000);
            }
        });

        redisConnection.on('error', (err) => {
            logger.error('Redis connection error (queue)', err);
        });

        redisConnection.on('connect', () => {
            logger.info('Redis connected (queue)');
        });
    }

    return redisConnection;
}

// ===========================================
// REPORT QUEUE
// ===========================================

let reportQueue: Queue | null = null;
let queueEvents: QueueEvents | null = null;

/**
 * Get or create the report generation queue
 */
export function getReportQueue(): Queue {
    if (!reportQueue) {
        const connection = getRedisConnection();

        reportQueue = new Queue(CONSTANTS.REPORT_QUEUE_NAME, {
            connection,
            defaultJobOptions: {
                attempts: CONSTANTS.REPORT_JOB_ATTEMPTS,
                backoff: {
                    type: 'exponential',
                    delay: CONSTANTS.REPORT_JOB_BACKOFF_DELAY
                },
                removeOnComplete: {
                    count: CONSTANTS.REPORT_COMPLETED_RETENTION_COUNT,
                    age: CONSTANTS.REPORT_RETENTION_DAYS * 24 * 3600
                },
                removeOnFail: {
                    count: CONSTANTS.REPORT_FAILED_RETENTION_COUNT
                }
            }
        });

        logger.info('Report queue initialized', { queueName: CONSTANTS.REPORT_QUEUE_NAME });
    }

    return reportQueue;
}

/**
 * Get queue events for monitoring
 */
export function getQueueEvents(): QueueEvents {
    if (!queueEvents) {
        const connection = getRedisConnection();
        queueEvents = new QueueEvents(CONSTANTS.REPORT_QUEUE_NAME, { connection });
    }
    return queueEvents;
}

// ===========================================
// QUEUE OPERATIONS
// ===========================================

/**
 * Add a report generation job to the queue
 * Uses reportId as jobId to prevent duplicates
 */
export async function queueReportGeneration(data: ReportJobData): Promise<Job> {
    const queue = getReportQueue();

    const job = await queue.add('generate-report', data, {
        jobId: data.reportId, // Prevent duplicate jobs for same report
        priority: 1 // Normal priority
    });

    logger.info('Report job queued', {
        jobId: job.id,
        reportId: data.reportId,
        pkg: data.package
    });

    return job;
}

/**
 * Get job status by ID
 */
export async function getJobStatus(jobId: string): Promise<{
    state: string;
    progress: number;
    data: ReportJobData | undefined;
    failedReason?: string;
} | null> {
    const queue = getReportQueue();
    const job = await queue.getJob(jobId);

    if (!job) {
        return null;
    }

    const state = await job.getState();
    const progress = typeof job.progress === 'number' ? job.progress : 0;

    return {
        state,
        progress,
        data: job.data,
        failedReason: job.failedReason
    };
}

/**
 * Get queue health metrics
 */
export async function getQueueMetrics(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}> {
    const queue = getReportQueue();

    const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount()
    ]);

    return { waiting, active, completed, failed, delayed };
}

/**
 * Pause the queue (for maintenance)
 */
export async function pauseQueue(): Promise<void> {
    const queue = getReportQueue();
    await queue.pause();
    logger.info('Report queue paused');
}

/**
 * Resume the queue
 */
export async function resumeQueue(): Promise<void> {
    const queue = getReportQueue();
    await queue.resume();
    logger.info('Report queue resumed');
}

// ===========================================
// GRACEFUL SHUTDOWN
// ===========================================

/**
 * Close queue connections gracefully
 */
export async function closeQueue(): Promise<void> {
    if (queueEvents) {
        await queueEvents.close();
        queueEvents = null;
    }

    if (reportQueue) {
        await reportQueue.close();
        reportQueue = null;
    }

    if (redisConnection) {
        await redisConnection.quit();
        redisConnection = null;
    }

    logger.info('Report queue connections closed');
}

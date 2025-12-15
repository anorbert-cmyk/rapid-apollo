// ===========================================
// HEALTH CHECK ROUTES
// Kubernetes-compatible liveness and readiness probes
// ===========================================

import { Router, Request, Response } from 'express';
import { getPool, isDatabaseAvailable } from '../db';
import { getStoreStats, isRedisAvailable } from '../utils/redisStore';
import { getRedisStatus } from '../utils/redisRateLimiter';
import { logger } from '../utils/logger';
import { config } from '../config';

const router = Router();

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    checks: {
        database: ComponentHealth;
        redis: ComponentHealth;
        memory: ComponentHealth;
    };
}

interface ComponentHealth {
    status: 'up' | 'down' | 'degraded';
    latencyMs?: number;
    details?: Record<string, any>;
}

const startTime = Date.now();

/**
 * GET /health
 * Comprehensive health check - returns all component statuses
 */
router.get('/', async (_req: Request, res: Response) => {
    const checks = await runHealthChecks();

    const overallStatus = determineOverallStatus(checks);

    const health: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - startTime) / 1000),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.NODE_ENV,
        checks
    };

    const statusCode = overallStatus === 'healthy' ? 200 :
        overallStatus === 'degraded' ? 200 : 503;

    return res.status(statusCode).json(health);
});

/**
 * GET /health/live
 * Kubernetes liveness probe - is the process alive?
 * Should only fail if the app needs to be restarted
 */
router.get('/live', (_req: Request, res: Response) => {
    // If we can respond, we're alive
    return res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /health/ready
 * Kubernetes readiness probe - can the app handle traffic?
 * Fails if critical dependencies are down
 */
router.get('/ready', async (_req: Request, res: Response) => {
    const checks = await runHealthChecks();

    // App is ready if at least memory store works
    // Database and Redis are optional (graceful degradation)
    const isReady = checks.memory.status === 'up';

    if (isReady) {
        return res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } else {
        return res.status(503).json({
            status: 'not_ready',
            timestamp: new Date().toISOString(),
            reason: 'Memory store unavailable'
        });
    }
});

/**
 * Run all health checks
 */
async function runHealthChecks(): Promise<HealthStatus['checks']> {
    const [database, redis, memory] = await Promise.all([
        checkDatabase(),
        checkRedis(),
        checkMemory()
    ]);

    return { database, redis, memory };
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<ComponentHealth> {
    if (!isDatabaseAvailable()) {
        return { status: 'down', details: { reason: 'Not configured' } };
    }

    const pool = getPool();
    if (!pool) {
        return { status: 'down', details: { reason: 'Pool not initialized' } };
    }

    try {
        const start = Date.now();
        await pool.query('SELECT 1');
        const latencyMs = Date.now() - start;

        return {
            status: 'up',
            latencyMs,
            details: {
                totalConnections: pool.totalCount,
                idleConnections: pool.idleCount,
                waitingClients: pool.waitingCount
            }
        };
    } catch (error) {
        logger.warn('Database health check failed', { error: (error as Error).message });
        return {
            status: 'down',
            details: { error: (error as Error).message }
        };
    }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<ComponentHealth> {
    const storeStats = getStoreStats();
    const rateLimiterStatus = getRedisStatus();

    if (!isRedisAvailable()) {
        return {
            status: storeStats.type === 'memory' ? 'degraded' : 'down',
            details: {
                type: storeStats.type,
                rateLimiter: rateLimiterStatus,
                reason: 'Using in-memory fallback'
            }
        };
    }

    return {
        status: 'up',
        details: {
            type: 'redis',
            rateLimiter: rateLimiterStatus
        }
    };
}

/**
 * Check memory usage
 */
async function checkMemory(): Promise<ComponentHealth> {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const heapPercentage = Math.round((usage.heapUsed / usage.heapTotal) * 100);

    // Warn if heap usage is above 80%
    const status = heapPercentage > 90 ? 'down' :
        heapPercentage > 80 ? 'degraded' : 'up';

    return {
        status,
        details: {
            heapUsedMB,
            heapTotalMB,
            heapPercentage,
            rssMB: Math.round(usage.rss / 1024 / 1024),
            externalMB: Math.round(usage.external / 1024 / 1024)
        }
    };
}

/**
 * Determine overall health status
 */
function determineOverallStatus(
    checks: HealthStatus['checks']
): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(checks).map(c => c.status);

    if (statuses.every(s => s === 'up')) return 'healthy';
    if (statuses.some(s => s === 'down')) return 'unhealthy';
    return 'degraded';
}

export default router;

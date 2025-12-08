// ===========================================
// ERROR MONITORING - Sentry Integration
// ===========================================

import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

// Sentry configuration (optional - works without key)
const SENTRY_DSN = process.env.SENTRY_DSN;

interface ErrorContext {
    userId?: string;
    walletAddress?: string;
    endpoint?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
    requestBody?: Record<string, unknown>;
}

/**
 * Initialize error monitoring
 * Call this at app startup
 */
export function initErrorMonitoring(): void {
    if (SENTRY_DSN) {
        logger.info('Error monitoring initialized (Sentry DSN provided)');
        // Note: Full Sentry SDK integration would go here
        // npm install @sentry/node @sentry/tracing
    } else {
        logger.info('Error monitoring running in local mode (no SENTRY_DSN)');
    }

    // Global unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection', reason instanceof Error ? reason : new Error(String(reason)), {
            type: 'unhandledRejection'
        });
    });

    // Global uncaught exception handler
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception', error, { type: 'uncaughtException' });
        // Give time to log before exit
        setTimeout(() => process.exit(1), 1000);
    });
}

/**
 * Capture and report an error
 */
export function captureError(error: Error, context?: ErrorContext): void {
    const sanitizedContext = context ? {
        ...context,
        walletAddress: context.walletAddress
            ? `${context.walletAddress.slice(0, 6)}...${context.walletAddress.slice(-4)}`
            : undefined,
        requestBody: undefined // Don't log full request bodies
    } : undefined;

    logger.error(error.message, error, sanitizedContext);

    if (SENTRY_DSN) {
        // Sentry.captureException(error, { extra: sanitizedContext });
    }
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    switch (level) {
        case 'info':
            logger.info(message);
            break;
        case 'warning':
            logger.warn(message);
            break;
        case 'error':
            logger.error(message);
            break;
    }

    if (SENTRY_DSN) {
        // Sentry.captureMessage(message, level);
    }
}

/**
 * Express error handling middleware
 */
export function errorMonitoringMiddleware(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const context: ErrorContext = {
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('user-agent'),
        ip: req.ip,
        walletAddress: req.body?.address
    };

    captureError(err, context);

    // Don't expose internal errors to clients
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message
    });
}

/**
 * Request tracking middleware (adds request ID)
 */
export function requestTrackingMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);

    // Log request start
    logger.debug('Request started', {
        requestId,
        method: req.method,
        path: req.path
    });

    // Log request end
    res.on('finish', () => {
        logger.debug('Request completed', {
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: Date.now() - parseInt(requestId.split('_')[1])
        });
    });

    next();
}

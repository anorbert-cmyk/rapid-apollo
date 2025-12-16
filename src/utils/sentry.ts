// ===========================================
// SENTRY ERROR MONITORING
// Production error tracking and performance monitoring
// ===========================================

import * as Sentry from '@sentry/node';
import { Express, Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';

let sentryInitialized = false;

/**
 * Initialize Sentry error monitoring
 * Only initializes in production if SENTRY_DSN is set
 */
export function initSentry(app?: Express): boolean {
    const dsn = process.env.SENTRY_DSN;

    if (!dsn) {
        logger.info('SENTRY_DSN not set - error monitoring disabled');
        return false;
    }

    if (config.NODE_ENV !== 'production') {
        logger.info('Sentry disabled in non-production environment');
        return false;
    }

    try {
        Sentry.init({
            dsn,
            environment: config.NODE_ENV,
            release: process.env.npm_package_version || '1.0.0',

            // Performance monitoring
            tracesSampleRate: 0.1, // 10% of transactions

            // Filter sensitive data
            beforeSend(event) {
                // Remove sensitive headers
                if (event.request?.headers) {
                    delete event.request.headers['authorization'];
                    delete event.request.headers['cookie'];
                    delete event.request.headers['x-api-key'];
                }

                // Remove sensitive body data
                if (event.request?.data) {
                    const data = event.request.data as any;
                    if (data.txHash) data.txHash = '[REDACTED]';
                    if (data.walletAddress) data.walletAddress = '[REDACTED]';
                    if (data.signature) data.signature = '[REDACTED]';
                }

                return event;
            },

            // Ignore certain errors
            ignoreErrors: [
                'Rate limit exceeded',
                'Invalid signature',
                'Token expired'
            ]
        });

        // Express integration using Sentry v8+ API
        if (app) {
            Sentry.setupExpressErrorHandler(app);
        }

        sentryInitialized = true;
        logger.info('Sentry error monitoring initialized');

        // Capture unhandled promise rejections
        process.on('unhandledRejection', (reason: any) => {
            logger.error('Unhandled Promise Rejection', reason instanceof Error ? reason : new Error(String(reason)));
            Sentry.captureException(reason);
        });

        // Capture uncaught exceptions
        process.on('uncaughtException', (error: Error) => {
            logger.error('Uncaught Exception', error);
            Sentry.captureException(error);
            // Give Sentry time to send the event before crashing
            Sentry.close(2000).then(() => process.exit(1));
        });

        return true;

    } catch (error) {
        logger.error('Failed to initialize Sentry', error as Error);
        return false;
    }
}

/**
 * Sentry error handler middleware
 * For Sentry v8+, this is a no-op as setupExpressErrorHandler handles it
 */
export function sentryErrorHandler() {
    return (_err: Error, _req: Request, _res: Response, next: NextFunction) => {
        // In Sentry v8, error handling is automatic via setupExpressErrorHandler
        // This middleware is kept for backward compatibility
        next(_err);
    };
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, any>): void {
    if (!sentryInitialized) {
        logger.error('Error captured (Sentry disabled)', error);
        return;
    }

    Sentry.captureException(error, {
        extra: context
    });
}

/**
 * Capture a message/event
 */
export function captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: Record<string, any>
): void {
    if (!sentryInitialized) {
        logger.info('Message captured (Sentry disabled)', { message, level });
        return;
    }

    Sentry.captureMessage(message, {
        level: level as Sentry.SeverityLevel,
        extra: context
    });
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id?: string; wallet?: string; email?: string }): void {
    if (!sentryInitialized) return;

    Sentry.setUser({
        id: user.id,
        username: user.wallet,
        email: user.email
    });
}

/**
 * Clear user context
 */
export function clearUser(): void {
    if (!sentryInitialized) return;
    Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
    message: string,
    category: string,
    data?: Record<string, any>
): void {
    if (!sentryInitialized) return;

    Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info'
    });
}

/**
 * Check if Sentry is initialized
 */
export function isSentryEnabled(): boolean {
    return sentryInitialized;
}

/**
 * Flush pending events before shutdown
 */
export async function flushSentry(timeout = 2000): Promise<void> {
    if (!sentryInitialized) return;

    await Sentry.close(timeout);
    logger.info('Sentry flushed');
}

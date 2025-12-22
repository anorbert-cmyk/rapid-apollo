import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { CONSTANTS } from './constants';
import { logger } from './utils/logger';
import { walletRateLimiter } from './utils/walletRateLimiter';
import { redisWalletRateLimiter, getRedisStatus, closeRedis } from './utils/redisRateLimiter';
import {
    initErrorMonitoring,
    errorMonitoringMiddleware,
    requestTrackingMiddleware
} from './utils/errorMonitoring';
import apiRoutes from './routes';
import path from 'path';
import adminRoutes from './routes/admin';
import paymentRoutes from './routes/payment';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import reportRoutes from './routes/reports';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import { initSentry, sentryErrorHandler, flushSentry } from './utils/sentry';
import { initRedisStore, closeRedisStore } from './utils/redisStore';
import { closeQueue } from './lib/queue';

// Load OpenAPI Spec
let swaggerDocument: any;
try {
    const yamlPath = path.join(__dirname, './docs/swagger.yaml');
    logger.info('Loading Swagger spec from path', { path: yamlPath });
    swaggerDocument = yaml.load(yamlPath);
} catch (error) {
    logger.error('Failed to load Swagger spec', error as Error);
}

// Initialize error monitoring
initErrorMonitoring();

const app = express();

// Security: Trust Proxy (Required for Railway/Load Balancers)
app.set('trust proxy', 1);

// ===== MIDDLEWARE =====

// Request tracking (adds request ID)
app.use(requestTrackingMiddleware);

// Helmet: Secure HTTP headers (CSP disabled for development flexibility)
app.use(helmet({
    contentSecurityPolicy: false,  // Disabled - was blocking inline handlers and icons
    crossOriginEmbedderPolicy: false  // Required for external scripts
}));

// Rate Limiting: IP-based (using constants)
const limiter = rateLimit({
    windowMs: CONSTANTS.RATE_LIMIT_WINDOW_MS,
    max: CONSTANTS.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    handler: (req, res) => {
        logger.warn('IP rate limit exceeded', { ip: req.ip });
        res.status(429).json({ error: 'Too many requests, please try again later.' });
    }
});

// Static files - served from 'public' directory from root (up one level from dist)
// MOVED ABOVE RATE LIMITER to prevent assets from consuming API quota
app.use(express.static(path.join(__dirname, '../public')));

// Disable rate limiting in test environment (Playwright runs parallel tests)
if (config.NODE_ENV !== 'test') {
    app.use(limiter);
}

// CORS: Configure allowed origins (use ALLOWED_ORIGIN env var in production)
app.use(cors({
    origin: config.ALLOWED_ORIGIN,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Body parsing
app.use(express.json({ limit: '100kb' })); // Limit body size to prevent large payload attacks

// ===== ROUTES =====

// Use Redis rate limiter in production, fallback to in-memory
const useRedisRateLimiter = config.NODE_ENV === 'production' && process.env.REDIS_URL;

// Per-wallet rate limiting for payment endpoints
app.use('/api/solve', useRedisRateLimiter ? redisWalletRateLimiter : walletRateLimiter);
app.use('/api/v1/solve', useRedisRateLimiter ? redisWalletRateLimiter : walletRateLimiter);

// Cookie parser for session management (with signing secret if available)
app.use(cookieParser(process.env.COOKIE_SECRET));

// Health check routes (no rate limiting, no auth)
app.use('/health', healthRoutes);

// Auth routes (magic link)
app.use('/auth', authRoutes);

// API v1 Routes (new versioned endpoints)
app.use('/api/v1', apiRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reports', reportRoutes);

// Deprecation middleware for legacy routes
// Sunset date: 6 months from current date
const getSunsetDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 6);
    return date.toUTCString();
};

const deprecationMiddleware = (_req: any, res: any, next: any) => {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', getSunsetDate());
    res.setHeader('Link', '</api/v1>; rel="successor-version"');
    next();
};

// Legacy Routes (backward compatibility - DEPRECATED)
app.use('/api', deprecationMiddleware, apiRoutes);
app.use('/api/admin', deprecationMiddleware, adminRoutes);
app.use('/api/payments', deprecationMiddleware, paymentRoutes);

// Sentry error handler (must be before other error handlers)
app.use(sentryErrorHandler());

// Error handling middleware (must be last)
app.use(errorMonitoringMiddleware);

// API Documentation
if (swaggerDocument) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    logger.info('Swagger UI enabled at /api-docs');
} else {
    app.use('/api-docs', (req, res) => res.status(503).json({ error: 'Docs unavailable' }));
}

// ===== GRACEFUL SHUTDOWN =====

async function gracefulShutdown(signal: string): Promise<void> {
    logger.info('Shutdown signal received', { signal });

    // Flush Sentry errors before shutdown
    await flushSentry();

    // Close Redis connections (both rate limiter and store)
    await closeRedisStore();
    await closeRedis();

    // Close BullMQ queue connections
    await closeQueue();

    logger.info('Graceful shutdown complete');
    process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ===== SERVER START =====

// Export app for testing
export { app };

// ===== SERVER START =====

// Only start the server if this file is run directly (not imported for tests)
if (require.main === module) {
    // Async startup function
    (async () => {
        // Run database migrations if DATABASE_URL is set
        if (process.env.DATABASE_URL) {
            try {
                const { initDatabase, runMigrations } = await import('./db');
                initDatabase();
                await runMigrations();
                logger.info('Database initialized and migrations applied');
            } catch (error) {
                logger.error('Database initialization failed', error as Error);
                // Continue without DB - will use in-memory fallback
            }
        }

        // Start the server
        const server = app.listen(config.PORT, () => {
            const redisStatus = getRedisStatus();

            logger.info('Server started', {
                port: config.PORT,
                env: config.NODE_ENV,
                apiVersion: CONSTANTS.API_VERSION
            });

            logger.info('Security enabled', {
                helmet: true,
                ipRateLimiting: true,
                walletRateLimiting: true,
                rateLimitStorage: redisStatus.type,
                errorMonitoring: true
            });

            if (config.NODE_ENV !== 'production') {
                logger.debug('Development mode', {
                    wallet: config.RECEIVER_WALLET_ADDRESS
                });
            }
        });
    })();
}

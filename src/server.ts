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
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';

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

// Helmet: Secure HTTP headers with proper CSP allowlist
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'", // Required for Tailwind and inline scripts
                "'unsafe-eval'",   // Required for Tailwind JIT
                "https://cdn.tailwindcss.com",
                "https://unpkg.com",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'", // Required for Tailwind and dynamic styles
                "https://fonts.googleapis.com",
                "https://cdn.tailwindcss.com",
                "https://unpkg.com"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "data:"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "blob:",
                "https:"  // Allow images from any HTTPS source
            ],
            connectSrc: [
                "'self'",
                "https://api.coingecko.com",      // ETH price API
                "https://rpc.sepolia.org",        // Sepolia RPC
                "https://eth.llamarpc.com",       // Mainnet RPC fallback
                "https://cloudflare-eth.com",     // Another RPC
                "wss://*.infura.io",              // WebSocket RPC
                "https://*.infura.io"
            ],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: []
        }
    },
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

// API v1 Routes (new versioned endpoints)
app.use('/api/v1', apiRoutes);
app.use('/api/v1/admin', adminRoutes);

// Legacy Routes (backward compatibility - will be deprecated)
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

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

    // Close Redis connection
    await closeRedis();

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
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { CONSTANTS } from './constants';
import { logger } from './utils/logger';
import { walletRateLimiter } from './utils/walletRateLimiter';
import apiRoutes from './routes';
import path from 'path';
import adminRoutes from './routes/admin';

const app = express();

// Security: Trust Proxy (Required for Railway/Load Balancers)
app.set('trust proxy', 1);

// ===== SECURITY MIDDLEWARE =====

// Helmet: Secure HTTP headers
// CSP temporarily disabled - was blocking CDN resources causing page to break
// TODO: Build proper CSP allowlist by checking browser console for blocked resources
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
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
app.use(limiter);

// CORS: Configure allowed origins (use ALLOWED_ORIGIN env var in production)
app.use(cors({
    origin: config.ALLOWED_ORIGIN,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Body parsing
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent large payload attacks

// Static files - served from 'public' directory from root (up one level from dist)
app.use(express.static(path.join(__dirname, '../public')));

// ===== ROUTES =====

// Per-wallet rate limiting for payment endpoints
app.use('/api/solve', walletRateLimiter);
app.use('/api/v1/solve', walletRateLimiter);

// API v1 Routes (new versioned endpoints)
app.use('/api/v1', apiRoutes);
app.use('/api/v1/admin', adminRoutes);

// Legacy Routes (backward compatibility - will be deprecated)
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

// ===== SERVER START =====

app.listen(config.PORT, () => {
    logger.info('Server started', {
        port: config.PORT,
        env: config.NODE_ENV,
        apiVersion: CONSTANTS.API_VERSION
    });

    logger.info('Security enabled', {
        helmet: true,
        rateLimiting: true,
        walletRateLimiting: true
    });

    if (config.NODE_ENV !== 'production') {
        logger.debug('Development mode', {
            wallet: config.RECEIVER_WALLET_ADDRESS
        });
    }
});

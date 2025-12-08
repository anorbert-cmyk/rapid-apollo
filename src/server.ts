import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
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

// Rate Limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
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

// Static files
// Static files - served from 'public' directory from root (up one level from dist)
app.use(express.static(path.join(__dirname, '../public')));

// ===== ROUTES =====
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes); // Admin analytics & stats

app.listen(config.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${config.PORT}`);
    console.log(`🔒 Security: Helmet + Rate Limiting enabled`);
    if (config.NODE_ENV !== 'production') {
        console.log(`💰 Wallet: ${config.RECEIVER_WALLET_ADDRESS}`);
    }
});

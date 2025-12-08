import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import apiRoutes from './routes';
import adminRoutes from './routes/admin';

const app = express();

// ===== SECURITY MIDDLEWARE =====

// Helmet: Secure HTTP headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'", // Needed for inline scripts in HTML
                "'unsafe-eval'",   // Needed for Tailwind CDN to compile CSS
                "https://cdnjs.cloudflare.com",
                "https://cdn.tailwindcss.com",
                "https://unpkg.com",
                "https://cdn.jsdelivr.net"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com"
            ],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: [
                "'self'",
                "https://etherscan.io",
                "https://api.etherscan.io",
                "wss://mainnet.infura.io",
                "wss://eth-mainnet.g.alchemy.com",
                "https://api.coingecko.com"
            ]
        }
    },
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
app.use(express.static('public'));

// ===== ROUTES =====
app.use('/api', apiRoutes);

app.listen(config.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${config.PORT}`);
    console.log(`🔒 Security: Helmet + Rate Limiting enabled`);
    if (config.NODE_ENV !== 'production') {
        console.log(`💰 Wallet: ${config.RECEIVER_WALLET_ADDRESS}`);
    }
});

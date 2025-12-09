import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('3000'),
    NODE_ENV: z.string().default('development'),
    GEMINI_API_KEY: z.string().min(1, "Gemini API Key is required"),
    // Ethereum Mainnet RPC (Public Ankr Node)
    RPC_URL: z.string().default('https://rpc.ankr.com/eth'),
    // My receiving wallet address (hardcoded for the demo or env)
    RECEIVER_WALLET_ADDRESS: z.string().startsWith('0x'),
    // Admin Wallet for Analytics Access (MUST be set in env, no default for security)
    ADMIN_WALLET_ADDRESS: z.string().startsWith('0x'),

    // CORS: Allowed origin for production
    // In production, this MUST be set to the actual domain
    ALLOWED_ORIGIN: z.string().default('*'),

    // Railway auto-detection (Railway sets this automatically)
    RAILWAY_PUBLIC_DOMAIN: z.string().optional(),

    // Pricing Service
    ETH_PRICE_API_URL: z.string().default('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'),

    // Tiers (USD)
    TIER_STANDARD_USD: z.number().default(19),
    TIER_MEDIUM_USD: z.number().default(49),
    TIER_FULL_USD: z.number().default(199),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("❌ Invalid environment variables:", parsedEnv.error.format());
    process.exit(1);
}

// Derive ALLOWED_ORIGIN for production
let finalAllowedOrigin = parsedEnv.data.ALLOWED_ORIGIN;

if (parsedEnv.data.NODE_ENV === 'production') {
    // If ALLOWED_ORIGIN is still '*' in production, try to use Railway domain
    if (finalAllowedOrigin === '*' && parsedEnv.data.RAILWAY_PUBLIC_DOMAIN) {
        finalAllowedOrigin = `https://${parsedEnv.data.RAILWAY_PUBLIC_DOMAIN}`;
        console.log(`🔒 CORS: Auto-detected Railway domain: ${finalAllowedOrigin}`);
    } else if (finalAllowedOrigin === '*') {
        console.warn('⚠️ WARNING: ALLOWED_ORIGIN is "*" in production! Set ALLOWED_ORIGIN env var for security.');
    }
}

export const config = {
    ...parsedEnv.data,
    ALLOWED_ORIGIN: finalAllowedOrigin
};

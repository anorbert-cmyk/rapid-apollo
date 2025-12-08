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
    // Admin Wallet for Analytics Access
    ADMIN_WALLET_ADDRESS: z.string().startsWith('0x').default('0xa14504ffe5E9A245c9d4079547Fa16fA0A823114'),

    // CORS: Allowed origin for production (e.g., 'https://yourdomain.com')
    ALLOWED_ORIGIN: z.string().default('*'),

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

export const config = parsedEnv.data;

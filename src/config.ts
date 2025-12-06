import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('3000'),
    GEMINI_API_KEY: z.string().min(1, "Gemini API Key is required"),
    // Using Sepolia RPC
    RPC_URL: z.string().default('https://rpc.sepolia.org'),
    // My receiving wallet address (hardcoded for the demo or env)
    RECEIVER_WALLET_ADDRESS: z.string().startsWith('0x'),

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

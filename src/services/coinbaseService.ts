import { config } from '../config';
import { logger } from '../utils/logger';
import { Tier, getTierPriceUSD } from './priceService';
import crypto from 'crypto';

// Coinbase Commerce REST API Base URL
const COINBASE_COMMERCE_API = 'https://api.commerce.coinbase.com';

export interface CoinbaseChargeResult {
    success: boolean;
    chargeId?: string;
    code?: string;
    hostedUrl?: string;
    error?: string;
}

/**
 * Get tier display name for Coinbase Charge
 */
function getTierDisplayName(tier: Tier): string {
    switch (tier) {
        case Tier.STANDARD: return 'Observer Tier';
        case Tier.MEDIUM: return 'Insider Tier (Genesis)';
        case Tier.FULL: return 'Syndicate Tier';
        default: return 'Aether Logic Access';
    }
}

/**
 * Create a Coinbase Commerce Charge for crypto payment
 * Uses direct REST API calls (no SDK required)
 */
export async function createCharge(
    tier: Tier,
    problemStatement: string,
    sessionId: string,
    walletAddress?: string
): Promise<CoinbaseChargeResult> {
    if (!config.COINBASE_COMMERCE_API_KEY) {
        return {
            success: false,
            error: 'Coinbase Commerce is not configured. Please set COINBASE_COMMERCE_API_KEY.'
        };
    }

    try {
        const priceUSD = getTierPriceUSD(tier);

        const chargeData = {
            name: getTierDisplayName(tier),
            description: `Aether Logic ${tier} tier - AI-powered strategic analysis`,
            local_price: {
                amount: priceUSD.toFixed(2),
                currency: 'USD'
            },
            pricing_type: 'fixed_price',
            metadata: {
                tier,
                sessionId,
                problemStatement: problemStatement.substring(0, 200),
                customerWallet: walletAddress || ''
            },
            redirect_url: config.COINBASE_SUCCESS_URL || `${config.ALLOWED_ORIGIN}/success`,
            cancel_url: config.COINBASE_CANCEL_URL || `${config.ALLOWED_ORIGIN}/cancel`
        };

        const response = await fetch(`${COINBASE_COMMERCE_API}/charges`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CC-Api-Key': config.COINBASE_COMMERCE_API_KEY,
                'X-CC-Version': '2018-03-22'
            },
            body: JSON.stringify(chargeData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const { data: charge } = await response.json();

        logger.info('Coinbase Commerce charge created', {
            chargeId: charge.id,
            code: charge.code,
            tier
        });

        return {
            success: true,
            chargeId: charge.id,
            code: charge.code,
            hostedUrl: charge.hosted_url
        };
    } catch (error: any) {
        logger.error('Failed to create Coinbase Commerce charge', error);
        return {
            success: false,
            error: error.message || 'Failed to create crypto payment'
        };
    }
}

/**
 * Verify Coinbase webhook signature
 */
export function verifyWebhookSignature(
    payload: string,
    signature: string
): boolean {
    if (!config.COINBASE_WEBHOOK_SECRET) {
        logger.error('Coinbase webhook secret not configured');
        return false;
    }

    try {
        const hash = crypto
            .createHmac('sha256', config.COINBASE_WEBHOOK_SECRET)
            .update(payload)
            .digest('hex');

        return hash === signature;
    } catch (error: any) {
        logger.error('Coinbase webhook signature verification failed', error);
        return false;
    }
}

/**
 * Check if Coinbase Commerce is configured
 */
export function isCoinbaseConfigured(): boolean {
    return !!config.COINBASE_COMMERCE_API_KEY;
}

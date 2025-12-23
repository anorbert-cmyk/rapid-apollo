import Stripe from 'stripe';
import { config } from '../config';
import { logger } from '../utils/logger';
import { Tier, getTierPriceUSD } from './priceService';

// Initialize Stripe client (only if API key is provided)
let stripe: Stripe | null = null;

const getStripe = (): Stripe => {
    if (!stripe) {
        if (!config.STRIPE_SECRET_KEY) {
            throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY.');
        }
        stripe = new Stripe(config.STRIPE_SECRET_KEY);
    }
    return stripe;
};

export interface CheckoutSessionResult {
    success: boolean;
    sessionId?: string;
    url?: string;
    error?: string;
}

/**
 * Get tier display name for Stripe checkout
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
 * Create a Stripe Checkout Session for one-time payment
 */
export async function createCheckoutSession(
    tier: Tier,
    problemStatement: string,
    metadata?: Record<string, string>
): Promise<CheckoutSessionResult> {
    try {
        const stripeClient = getStripe();
        const priceUSD = getTierPriceUSD(tier);
        const priceCents = Math.round(priceUSD * 100); // Stripe uses cents

        const session = await stripeClient.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: getTierDisplayName(tier),
                            description: `Aether Logic - ${tier.charAt(0).toUpperCase() + tier.slice(1)} tier access`,
                        },
                        unit_amount: priceCents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            // CRITICAL: Collect customer email for magic link delivery
            customer_creation: 'always',
            success_url: config.STRIPE_SUCCESS_URL || `${config.ALLOWED_ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: config.STRIPE_CANCEL_URL || `${config.ALLOWED_ORIGIN}/cancel`,
            metadata: {
                tier,
                problemStatement: problemStatement.substring(0, 500), // Stripe metadata limit
                ...metadata
            },
        });

        logger.info('Stripe Checkout session created', { sessionId: session.id, tier });

        return {
            success: true,
            sessionId: session.id,
            url: session.url || undefined
        };
    } catch (error: any) {
        logger.error('Failed to create Stripe Checkout session', error);
        return {
            success: false,
            error: error.message || 'Failed to create payment session'
        };
    }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
): Stripe.Event | null {
    try {
        const stripeClient = getStripe();
        if (!config.STRIPE_WEBHOOK_SECRET) {
            logger.error('Stripe webhook secret not configured');
            return null;
        }

        const event = stripeClient.webhooks.constructEvent(
            payload,
            signature,
            config.STRIPE_WEBHOOK_SECRET
        );
        return event;
    } catch (error: any) {
        logger.error('Stripe webhook signature verification failed', error);
        return null;
    }
}

/**
 * Retrieve a Checkout Session by ID
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
    try {
        const stripeClient = getStripe();
        const session = await stripeClient.checkout.sessions.retrieve(sessionId);
        return session;
    } catch (error: any) {
        logger.error('Failed to retrieve Stripe session', error);
        return null;
    }
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
    return !!config.STRIPE_SECRET_KEY;
}

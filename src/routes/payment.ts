import { Router, Request, Response } from 'express';
import { createCheckoutSession, verifyWebhookSignature as verifyStripeSignature, getCheckoutSession, isStripeConfigured } from '../services/stripeService';
import { createCharge, verifyWebhookSignature as verifyCoinbaseSignature, isCoinbaseConfigured } from '../services/coinbaseService';
import { Tier } from '../services/priceService';
import { logger } from '../utils/logger';
import { solveProblem } from '../services/aiService';
import { resultStore, usedTxHashes, userHistoryStore, transactionLogStore } from '../store';
import { isDatabaseAvailable, withTransaction } from '../db';
import * as solutionRepo from '../db/solutionRepository';
import { stripeSessionRequestSchema, coinbaseChargeRequestSchema } from '../utils/validators';
import { tryMarkWebhookProcessed } from '../utils/webhookIdempotency';
import * as redisStore from '../utils/redisStore';
import { ZodError } from 'zod';
import { createMagicLink, getMagicLinkUrl } from '../services/magicLinkService';
import { sendMagicLinkEmail, isEmailConfigured, sendRapidApolloEmail } from '../services/emailService';
import { config } from '../config';

const router = Router();

// Type definition for stored sessions
interface PaymentSession {
    tier: Tier;
    problemStatement: string;
    createdAt: number;
    status: 'pending' | 'completed' | 'failed';
}

const SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds

// Helper to get session key
const getSessionKey = (sessionId: string) => `payment_session:${sessionId}`;

/**
 * POST /api/payments/stripe/create-session
 * Create a Stripe Checkout Session
 */
router.post('/stripe/create-session', async (req: Request, res: Response) => {
    try {
        if (!isStripeConfigured()) {
            return res.status(503).json({ error: 'Stripe payments are not configured' });
        }

        // Validate request with Zod
        const validated = stripeSessionRequestSchema.safeParse(req.body);

        if (!validated.success) {
            const errors = validated.error.flatten().fieldErrors;
            const errorMsg = Object.entries(errors).map(([k, v]) => `${k}: ${v?.join(', ')}`).join('; ');
            return res.status(400).json({ error: `Validation failed: ${errorMsg || 'Invalid request'}` });
        }

        const { tier, problemStatement } = validated.data;
        const recaptchaToken = req.body.recaptchaToken;

        // Verify reCAPTCHA (if configured)
        const { verifyRecaptcha } = await import('../utils/recaptcha');
        const captchaResult = await verifyRecaptcha(recaptchaToken, 'stripe_payment');

        if (!captchaResult.success) {
            logger.warn('reCAPTCHA failed for Stripe session', { score: captchaResult.score, reason: captchaResult.reason });
            return res.status(403).json({ error: 'Security verification failed. Please try again.' });
        }

        const result = await createCheckoutSession(tier as Tier, problemStatement);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        // Store pending session in Redis
        if (result.sessionId) {
            const sessionData: PaymentSession = {
                tier: tier as Tier,
                problemStatement,
                createdAt: Date.now(),
                status: 'pending'
            };
            await redisStore.set(
                getSessionKey(result.sessionId),
                JSON.stringify(sessionData),
                SESSION_TTL
            );
        }

        return res.json({
            success: true,
            sessionId: result.sessionId,
            url: result.url
        });
    } catch (error: any) {
        logger.error('Stripe create-session error', error);
        return res.status(500).json({ error: 'Failed to create payment session' });
    }
});

/**
 * POST /api/payments/coinbase/create-charge
 * Create a Coinbase Commerce Charge
 */
router.post('/coinbase/create-charge', async (req: Request, res: Response) => {
    try {
        if (!isCoinbaseConfigured()) {
            return res.status(503).json({ error: 'Coinbase Commerce is not configured' });
        }

        // Validate request with Zod
        const validated = coinbaseChargeRequestSchema.safeParse(req.body);

        if (!validated.success) {
            const errors = validated.error.flatten().fieldErrors;
            const errorMsg = Object.entries(errors).map(([k, v]) => `${k}: ${v?.join(', ')}`).join('; ');
            return res.status(400).json({ error: `Validation failed: ${errorMsg || 'Invalid request'}` });
        }

        const { tier, problemStatement, walletAddress } = validated.data;

        // Generate a unique session ID
        const sessionId = `cb_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const result = await createCharge(tier as Tier, problemStatement, sessionId, walletAddress);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        // Store pending session in Redis
        const sessionData: PaymentSession = {
            tier: tier as Tier,
            problemStatement,
            createdAt: Date.now(),
            status: 'pending'
        };
        await redisStore.set(
            getSessionKey(sessionId),
            JSON.stringify(sessionData),
            SESSION_TTL
        );

        return res.json({
            success: true,
            chargeId: result.chargeId,
            code: result.code,
            url: result.hostedUrl
        });
    } catch (error: any) {
        logger.error('Coinbase create-charge error', error);
        return res.status(500).json({ error: 'Failed to create crypto payment' });
    }
});

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
router.post('/webhooks/stripe', async (req: Request, res: Response) => {
    try {
        const signature = req.headers['stripe-signature'] as string;

        if (!signature) {
            return res.status(400).json({ error: 'Missing stripe-signature header' });
        }

        // Note: req.body should be raw for Stripe signature verification
        // This requires express.raw() middleware for this route
        const event = verifyStripeSignature(req.body, signature);

        if (!event) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const eventId = event.id;
        logger.info('Stripe webhook received', { type: event.type, eventId });

        switch (event.type) {
            case 'checkout.session.completed': {
                // Atomic check-and-mark to prevent race conditions
                const isNew = await tryMarkWebhookProcessed(eventId, event.type, 'stripe');
                if (!isNew) {
                    logger.info('Stripe webhook already processed (idempotent)', { eventId, type: event.type });
                    return res.json({ received: true, duplicate: true });
                }

                const session = event.data.object as any;
                const sessionId = session.id;
                const metadata = session.metadata || {};

                await processSuccessfulPayment(
                    sessionId,
                    metadata.tier as Tier,
                    metadata.problemStatement,
                    'stripe',
                    session.customer_email
                );
                break;
            }
            case 'checkout.session.expired': {
                const isNew = await tryMarkWebhookProcessed(eventId, event.type, 'stripe');
                if (!isNew) return res.json({ received: true, duplicate: true });

                const session = event.data.object as any;
                const key = getSessionKey(session.id);
                const pendingData = await redisStore.get(key);

                if (pendingData) {
                    const pending: PaymentSession = JSON.parse(pendingData);
                    pending.status = 'failed';
                    await redisStore.set(key, JSON.stringify(pending), SESSION_TTL);
                }
                logger.info('Stripe session expired', { sessionId: session.id });
                break;
            }
        }

        return res.json({ received: true });
    } catch (error: any) {
        logger.error('Stripe webhook error', error);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * POST /api/webhooks/coinbase
 * Handle Coinbase Commerce webhook events
 */
router.post('/webhooks/coinbase', async (req: Request, res: Response) => {
    try {
        const signature = req.headers['x-cc-webhook-signature'] as string;

        if (!signature) {
            return res.status(400).json({ error: 'Missing webhook signature' });
        }

        const payload = JSON.stringify(req.body);

        if (!verifyCoinbaseSignature(payload, signature)) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = req.body;

        const eventId = event.id || `${event.type}_${Date.now()}`;
        logger.info('Coinbase webhook received', { type: event.type, eventId });

        switch (event.type) {
            case 'charge:confirmed': {
                // Atomic check-and-mark to prevent race conditions
                const isNew = await tryMarkWebhookProcessed(eventId, event.type, 'coinbase');
                if (!isNew) {
                    logger.info('Coinbase webhook already processed (idempotent)', { eventId, type: event.type });
                    return res.json({ received: true, duplicate: true });
                }

                const charge = event.data;
                const metadata = charge.metadata || {};

                await processSuccessfulPayment(
                    metadata.sessionId,
                    metadata.tier as Tier,
                    metadata.problemStatement,
                    'coinbase',
                    metadata.customerWallet
                );
                break;
            }
            case 'charge:failed': {
                const isNew = await tryMarkWebhookProcessed(eventId, event.type, 'coinbase');
                if (!isNew) return res.json({ received: true, duplicate: true });

                const charge = event.data;
                const sessionId = charge.metadata?.sessionId;
                if (sessionId) {
                    const key = getSessionKey(sessionId);
                    const pendingData = await redisStore.get(key);
                    if (pendingData) {
                        const pending: PaymentSession = JSON.parse(pendingData);
                        pending.status = 'failed';
                        await redisStore.set(key, JSON.stringify(pending), SESSION_TTL);
                    }
                }
                logger.info('Coinbase charge failed', { chargeId: charge.id });
                break;
            }
        }

        return res.json({ received: true });
    } catch (error: any) {
        logger.error('Coinbase webhook error', error);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
});

/**
 * GET /api/payments/status/:sessionId
 * Check payment status
 */
router.get('/status/:sessionId', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const key = getSessionKey(sessionId);
        const sessionData = await redisStore.get(key);

        if (!sessionData) {
            // Try to get from Stripe if it looks like a Stripe session ID
            if (sessionId.startsWith('cs_')) {
                const stripeSession = await getCheckoutSession(sessionId);
                if (stripeSession) {
                    return res.json({
                        status: stripeSession.payment_status === 'paid' ? 'completed' : 'pending',
                        tier: stripeSession.metadata?.tier
                    });
                }
            }
            return res.status(404).json({ error: 'Session not found' });
        }

        const session: PaymentSession = JSON.parse(sessionData);

        return res.json({
            status: session.status,
            tier: session.tier
        });
    } catch (error: any) {
        logger.error('Payment status check error', error);
        return res.status(500).json({ error: 'Failed to check status' });
    }
});

/**
 * GET /api/payments/config
 * Get payment configuration status
 */
router.get('/config', (_req: Request, res: Response) => {
    return res.json({
        stripe: isStripeConfigured(),
        coinbase: isCoinbaseConfigured()
    });
});

/**
 * Process successful payment and generate solution
 */
async function processSuccessfulPayment(
    sessionId: string,
    tier: Tier,
    problemStatement: string,
    provider: 'stripe' | 'coinbase',
    customerIdentifier?: string
): Promise<void> {
    try {
        const key = getSessionKey(sessionId);
        const pendingData = await redisStore.get(key);
        const pending: PaymentSession | null = pendingData ? JSON.parse(pendingData) : null;

        // Use stored data if available, otherwise use provided data
        const actualTier = pending?.tier || tier;
        const actualProblem = pending?.problemStatement || problemStatement;

        if (!actualTier || !actualProblem) {
            logger.error('Missing payment data for processing', new Error(`Missing data for session: ${sessionId}`));
            return;
        }

        // Generate unique transaction ID for this payment
        const txId = `${provider}_${sessionId}`;

        // Check for duplicate processing
        const alreadyProcessed = await usedTxHashes.get(txId);
        if (alreadyProcessed) {
            logger.warn('Payment already processed', { txId });
            return;
        }

        // Mark as processing
        await usedTxHashes.set(txId, Date.now() as any);

        logger.info('Processing successful payment', { sessionId, tier: actualTier, provider });

        // Generate AI solution
        const solutionResponse = await solveProblem(actualProblem, actualTier, txId);

        const resultData = {
            txHash: txId,
            tier: actualTier,
            problem: actualProblem,
            solution: solutionResponse.rawMarkdown,
            sections: solutionResponse.sections,
            meta: solutionResponse.meta,
            timestamp: new Date().toISOString()
        };

        // Store result
        await resultStore.set(txId, {
            data: resultData,
            timestamp: Date.now()
        });

        // Update session status in Redis
        if (pending) {
            pending.status = 'completed';
            await redisStore.set(key, JSON.stringify(pending), SESSION_TTL);
        }

        // Store in database if available
        if (isDatabaseAvailable()) {
            // Save solution
            if (customerIdentifier) {
                await solutionRepo.saveSolution(
                    txId,
                    customerIdentifier,
                    actualTier,
                    actualProblem,
                    solutionResponse
                );
            }

            // Log transaction for admin stats (PostgreSQL)
            await solutionRepo.logTransaction(
                txId,
                customerIdentifier || 'fiat_payment',
                actualTier
            );

            // Update aggregate stats (PostgreSQL)
            const tierPrices: Record<string, number> = {
                'standard': 0.005,
                'medium': 0.013,
                'full': 0.052
            };
            const ethAmount = tierPrices[actualTier] || 0;
            await solutionRepo.updateStats(actualTier, ethAmount);

            logger.info('Transaction logged to PostgreSQL', { txId, tier: actualTier });
        }

        // Add to user history if we have customer identifier
        if (customerIdentifier) {
            const history = (await userHistoryStore.get(customerIdentifier.toLowerCase())) || [];
            history.unshift(resultData as any);
            if (history.length > 20) history.length = 20;
            await userHistoryStore.set(customerIdentifier.toLowerCase(), history);
        }

        // Log transaction to Redis (fallback/legacy)
        const txLog = (await transactionLogStore.get('all')) || [];
        txLog.unshift({
            wallet: customerIdentifier || 'fiat_payment',
            tier: actualTier,
            timestamp: new Date().toISOString(),
            txHash: txId
        });
        if (txLog.length > 100) txLog.length = 100;
        await transactionLogStore.set('all', txLog);

        // Send magic link email if email is available and service is configured
        if (customerIdentifier && customerIdentifier.includes('@') && isEmailConfigured()) {
            try {
                const magicToken = await createMagicLink(
                    customerIdentifier,
                    txId,
                    actualTier,
                    actualProblem.substring(0, 200)
                );
                const magicLinkUrl = getMagicLinkUrl(magicToken);

                // Determine amount based on tier for the receipt
                const prices: Record<string, string> = {
                    'standard': String(config.TIER_STANDARD_USD),
                    'medium': String(config.TIER_MEDIUM_USD),
                    'full': String(config.TIER_FULL_USD),
                    'premium': String(config.TIER_PREMIUM_USD)
                };
                const amount = prices[actualTier] || '0';

                await sendRapidApolloEmail({
                    to: customerIdentifier,
                    userName: customerIdentifier.split('@')[0], // Extract name part from email
                    magicLinkUrl: magicLinkUrl,
                    transactionId: txId,
                    amount: amount,
                    currency: 'USD'
                });

                logger.info('Magic link email sent', { email: customerIdentifier.substring(0, 5) + '***' });
            } catch (emailError) {
                logger.error('Failed to send magic link email', emailError instanceof Error ? emailError : new Error(String(emailError)));
                // Don't fail the payment processing if email fails
            }
        }

        logger.info('Payment processed successfully', { txId, tier: actualTier });

    } catch (error: any) {
        logger.error('Failed to process payment', error);
    }
}

export default router;

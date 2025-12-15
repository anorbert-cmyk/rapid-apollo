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
import { isWebhookProcessed, markWebhookProcessed } from '../utils/webhookIdempotency';
import { ZodError } from 'zod';

const router = Router();

// In-memory store for pending payment sessions
const pendingSessions: Map<string, {
    tier: Tier;
    problemStatement: string;
    createdAt: number;
    status: 'pending' | 'completed' | 'failed';
}> = new Map();

// Clean up old sessions (older than 24 hours)
setInterval(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const [id, session] of pendingSessions.entries()) {
        if (session.createdAt < cutoff) {
            pendingSessions.delete(id);
        }
    }
}, 60 * 60 * 1000); // Run every hour

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

        const result = await createCheckoutSession(tier as Tier, problemStatement);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        // Store pending session
        if (result.sessionId) {
            pendingSessions.set(result.sessionId, {
                tier: tier as Tier,
                problemStatement,
                createdAt: Date.now(),
                status: 'pending'
            });
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

        // Store pending session
        pendingSessions.set(sessionId, {
            tier: tier as Tier,
            problemStatement,
            createdAt: Date.now(),
            status: 'pending'
        });

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

        // Check for duplicate webhook (idempotency)
        const eventId = event.id;
        if (isWebhookProcessed(eventId, 'stripe')) {
            logger.info('Stripe webhook already processed (idempotent)', { eventId, type: event.type });
            return res.json({ received: true, duplicate: true });
        }

        logger.info('Stripe webhook received', { type: event.type, eventId });

        switch (event.type) {
            case 'checkout.session.completed': {
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

                // Mark as processed after successful handling
                markWebhookProcessed(eventId, event.type, 'stripe');
                break;
            }
            case 'checkout.session.expired': {
                const session = event.data.object as any;
                const pending = pendingSessions.get(session.id);
                if (pending) {
                    pending.status = 'failed';
                }
                markWebhookProcessed(eventId, event.type, 'stripe');
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

        // Check for duplicate webhook (idempotency)
        const eventId = event.id || `${event.type}_${Date.now()}`;
        if (isWebhookProcessed(eventId, 'coinbase')) {
            logger.info('Coinbase webhook already processed (idempotent)', { eventId, type: event.type });
            return res.json({ received: true, duplicate: true });
        }

        logger.info('Coinbase webhook received', { type: event.type, eventId });

        switch (event.type) {
            case 'charge:confirmed': {
                const charge = event.data;
                const metadata = charge.metadata || {};

                await processSuccessfulPayment(
                    metadata.sessionId,
                    metadata.tier as Tier,
                    metadata.problemStatement,
                    'coinbase',
                    metadata.customerWallet
                );

                // Mark as processed after successful handling
                markWebhookProcessed(eventId, event.type, 'coinbase');
                break;
            }
            case 'charge:failed': {
                const charge = event.data;
                const sessionId = charge.metadata?.sessionId;
                if (sessionId) {
                    const pending = pendingSessions.get(sessionId);
                    if (pending) {
                        pending.status = 'failed';
                    }
                }
                markWebhookProcessed(eventId, event.type, 'coinbase');
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
        const session = pendingSessions.get(sessionId);

        if (!session) {
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
        const pending = pendingSessions.get(sessionId);

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

        // Update session status
        if (pending) {
            pending.status = 'completed';
        }

        // Store in database if available
        if (isDatabaseAvailable() && customerIdentifier) {
            await solutionRepo.saveSolution(
                txId,
                customerIdentifier,
                actualTier,
                actualProblem,
                solutionResponse
            );
        }

        // Add to user history if we have customer identifier
        if (customerIdentifier) {
            const history = (await userHistoryStore.get(customerIdentifier.toLowerCase())) || [];
            history.unshift(resultData as any);
            if (history.length > 20) history.length = 20;
            await userHistoryStore.set(customerIdentifier.toLowerCase(), history);
        }

        // Log transaction
        const txLog = (await transactionLogStore.get('all')) || [];
        txLog.unshift({
            wallet: customerIdentifier || 'fiat_payment',
            tier: actualTier,
            timestamp: new Date().toISOString(),
            txHash: txId
        });
        if (txLog.length > 100) txLog.length = 100;
        await transactionLogStore.set('all', txLog);

        logger.info('Payment processed successfully', { txId, tier: actualTier });

    } catch (error: any) {
        logger.error('Failed to process payment', error);
    }
}

export default router;

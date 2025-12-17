import { Router, Request, Response } from 'express';
import { verifyTransaction } from '../services/paymentService';
import { solveProblem } from '../services/aiService';
import { getTierPriceETH, Tier } from '../services/priceService';
import { config } from '../config';
import { CONSTANTS } from '../constants';
import { logger } from '../utils/logger';
import { resultStore, usedTxHashes, userHistoryStore, statsStore, shareStore, transactionLogStore } from '../store';
import { solveRequestSchema, txHashSchema } from '../utils/validators';
import { ZodError } from 'zod';
import { verifyMessage } from 'ethers';
import { checkAndMarkSignatureAsync } from '../utils/signatureStore';
import * as solutionRepo from '../db/solutionRepository';
import { isDatabaseAvailable } from '../db';

// Simple UUID Helper
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const router = Router();

// Helper to push to history
async function addToUserHistory(walletAddress: string, resultData: any) {
    const current = (await userHistoryStore.get(walletAddress)) || [];
    // Dedup by txHash
    if (!current.find((r: any) => r.txHash === resultData.txHash)) {
        current.unshift(resultData); // Add to top
    }
    // Limit to configured max
    if (current.length > CONSTANTS.MAX_USER_HISTORY) {
        current.length = CONSTANTS.MAX_USER_HISTORY;
    }

    await userHistoryStore.set(walletAddress, current);
}

async function updateStats(tier: string) {
    try {
        // Increment Total Solves
        const currentSolves = (await statsStore.get('total_solves')) || 0;
        await statsStore.set('total_solves', currentSolves + 1);

        // Increment Tier Count
        const tierKey = `count_${tier}`;
        const currentTier = (await statsStore.get(tierKey)) || 0;
        await statsStore.set(tierKey, currentTier + 1);

        // Track Revenue (Approximate based on current price)
        const priceStr = await getTierPriceETH(tier as Tier);
        const price = parseFloat(priceStr);
        const currentRev = (await statsStore.get('total_revenue_eth')) || 0;
        await statsStore.set('total_revenue_eth', currentRev + price);

    } catch (e) {
        logger.error('Failed to update stats', e instanceof Error ? e : new Error(String(e)));
    }
}

// GET /health
router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /api/share/create
router.post('/share/create', async (req: Request, res: Response) => {
    try {
        const { txHash, address, signature, timestamp } = req.body;
        // Verify Auth (Only owner can share)
        if (!txHash || !address || !signature || !timestamp) return res.status(400).json({ error: 'Missing params' });

        // SECURITY: Validate timestamp (max 5 minutes old)
        const now = Date.now();
        if (typeof timestamp !== 'number' || Math.abs(now - timestamp) > CONSTANTS.SIGNATURE_VALIDITY_MS) {
            logger.warn('Expired or invalid timestamp on share/create', { wallet: address, timestamp });
            return res.status(403).json({ error: 'Request expired. Please try again.' });
        }

        const message = `Authorize Share for TX ${txHash} at ${timestamp}`;
        const recovered = verifyMessage(message, signature);
        if (recovered.toLowerCase() !== address.toLowerCase()) {
            return res.status(403).json({ error: 'Invalid signature' });
        }

        // Prevent signature replay attacks (async for Redis support)
        const isValidSignature = await checkAndMarkSignatureAsync(signature, address);
        if (!isValidSignature) {
            logger.warn('Signature replay attempt on share/create', { wallet: address });
            return res.status(403).json({ error: 'Signature already used. Please sign again.' });
        }

        const uuid = generateUUID();
        await shareStore.set(uuid, txHash);

        return res.json({ success: true, link: uuid });

    } catch (e) {
        logger.error('Share creation failed', e instanceof Error ? e : new Error(String(e)));
        res.status(500).json({ error: 'Share creation failed' });
    }
});

// GET /api/pricing
router.get('/pricing', async (_req: Request, res: Response) => {
    try {
        const [std, med, full] = await Promise.all([
            getTierPriceETH(Tier.STANDARD),
            getTierPriceETH(Tier.MEDIUM),
            getTierPriceETH(Tier.FULL)
        ]);
        res.json({
            standard: std,
            medium: med,
            full: full
            // SECURITY: receiverAddress intentionally omitted from public API
        });
    } catch (error) {
        logger.error('Failed to fetch prices', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({ error: 'Failed to fetch prices' });
    }
});

// GET /api/config
// NOTE: This endpoint exposes the receiver address. This is intentional and unavoidable.
// Users MUST know the recipient address to sign a transaction in MetaMask.
// The original request was to hide it from "the website UI", not from the API entirely.
// Blockchain transactions are transparent - obfuscation here provides no real security.
router.get('/config', (_req: Request, res: Response) => {
    res.json({
        receiverAddress: config.RECEIVER_WALLET_ADDRESS
    });
});

// GET /api/result/:txHash
// SECURITY REMOVAL: Public access to results via TX Hash is insecure (sniping risk).
// Results are now returned directly in the POST /solve response.
/*
router.get('/result/:txHash', async (req: Request, res: Response) => {
   ... removed for security ...
});
*/

// POST /api/solve
router.post('/solve', async (req: Request, res: Response) => {
    try {
        // ===== INPUT VALIDATION =====
        const parseResult = solveRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            const errors = parseResult.error.issues.map((e: { message: string }) => e.message).join(', ');
            return res.status(400).json({ error: `Validation failed: ${errors}` });
        }

        const { problemStatement, txHash, tier } = parseResult.data;

        // ===== DOUBLE-SPEND PROTECTION (ATOMIC) =====
        // Try to set the lock. If it fails, it means it already exists.
        const acquiredLock = await usedTxHashes.setnx(txHash, Date.now() as any);

        if (!acquiredLock) {
            logger.warn('Double-spend attempt or race condition', { txHash });
            return res.status(409).json({ error: 'Transaction already processed or in progress' });
        }

        logger.info('Verifying payment', { txHash, tier });

        // Verify Payment (Cast tier to Tier enum)
        const payment = await verifyTransaction(txHash, tier as Tier);

        if (!payment.valid) {
            logger.warn('Payment invalid', { txHash, message: payment.message });
            // SECURITY: Keep lock for 5 minutes on failure to prevent rapid retry attacks
            await usedTxHashes.set(txHash, { status: 'failed', at: Date.now() } as any);
            return res.status(402).json({ error: payment.message });
        }

        // ... (Verification Success)
        await usedTxHashes.set(txHash, Date.now() as any);

        logger.info('Payment valid, solving problem', { txHash, tier });
        const solutionResponse = await solveProblem(problemStatement, tier, txHash);

        const resultData = {
            txHash,
            tier,
            problem: problemStatement,
            solution: solutionResponse.rawMarkdown,
            sections: solutionResponse.sections,
            meta: solutionResponse.meta,
            timestamp: new Date().toISOString()
        };

        // ===== PERSISTENCE =====

        // 1. PostgreSQL (Primary - persistent storage)
        if (isDatabaseAvailable() && payment.from) {
            await solutionRepo.saveSolution(
                txHash,
                payment.from,
                tier,
                problemStatement,
                solutionResponse
            );
            await solutionRepo.markTxHashUsed(txHash);
            await solutionRepo.logTransaction(txHash, payment.from, tier);

            // Get ETH price for stats
            const ethPrice = parseFloat(await getTierPriceETH(tier as Tier));
            await solutionRepo.updateStats(tier, ethPrice);

            logger.info('Solution persisted to PostgreSQL', { txHash });
        }

        // 2. Redis/In-Memory (Backup - for cache and non-DB deployments)
        await resultStore.set(txHash, {
            data: resultData,
            timestamp: Date.now()
        });

        if (payment.from) {
            await addToUserHistory(payment.from.toLowerCase(), resultData);
        }

        // 3. Legacy transaction log (Redis)
        if (payment.from) {
            const txLog = (await transactionLogStore.get('all')) || [];
            txLog.unshift({
                wallet: payment.from.toLowerCase(),
                tier: tier,
                timestamp: new Date().toISOString(),
                txHash: txHash
            });
            if (txLog.length > CONSTANTS.MAX_TRANSACTIONS_LOG) {
                txLog.length = CONSTANTS.MAX_TRANSACTIONS_LOG;
            }
            await transactionLogStore.set('all', txLog);
        }

        // 4. Update Redis stats (backup)
        updateStats(tier);

        return res.json({ success: true, ...resultData });

    } catch (error) {
        logger.error('Solve endpoint error', error instanceof Error ? error : new Error(String(error)));
        if (error instanceof ZodError) {
            return res.status(400).json({ error: 'Invalid input data' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
});


// POST /api/history - Secure Sync
router.post('/history', async (req: Request, res: Response) => {
    try {
        const { walletAddress, signature, timestamp } = req.body;

        if (!walletAddress || !signature || !timestamp) {
            return res.status(400).json({ error: 'Missing auth parameters' });
        }

        // 1. Check Timestamp (prevent replay attacks, allow 5 min window)
        const now = Date.now();
        if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
            return res.status(401).json({ error: 'Auth token expired' });
        }

        // 2. Verify Signature
        const expectedMessage = `Authenticate to Rapid Apollo History: ${timestamp}`;
        const recoveredAddress = verifyMessage(expectedMessage, signature);

        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(403).json({ error: 'Invalid signature' });
        }

        // 3. Prevent signature replay attacks (async for Redis support)
        const isValid = await checkAndMarkSignatureAsync(signature, walletAddress);
        if (!isValid) {
            logger.warn('Signature replay attempt on history', { wallet: walletAddress });
            return res.status(403).json({ error: 'Signature already used. Please sign again.' });
        }

        // 3. Fetch History (PostgreSQL first, then Redis fallback)
        let history: any[] = [];

        if (isDatabaseAvailable()) {
            const dbSolutions = await solutionRepo.getSolutionsByWallet(walletAddress);
            history = dbSolutions.map(s => ({
                txHash: s.txHash,
                tier: s.tier,
                problem: s.problemStatement,
                solution: s.rawMarkdown,
                sections: s.sections,
                meta: {
                    originalProblem: s.problemStatement,
                    tier: s.tier,
                    provider: s.provider,
                    generatedAt: s.createdAt.getTime()
                },
                timestamp: s.createdAt.toISOString()
            }));
            logger.debug('History fetched from PostgreSQL', { wallet: walletAddress, count: history.length });
        } else {
            // Fallback to Redis/in-memory
            history = (await userHistoryStore.get(walletAddress.toLowerCase())) || [];
        }

        return res.json({ success: true, history });

    } catch (error) {
        logger.error('History sync error', error instanceof Error ? error : new Error(String(error)));
        return res.status(500).json({ error: 'Failed to sync history' });
    }
});

// GET /api/share/:uuid
// Public endpoint for the view-only page content fetch
router.get('/share/:uuid', async (req: Request, res: Response) => {
    try {
        const { uuid } = req.params;
        const txHash = await shareStore.get(uuid);

        if (!txHash) return res.status(404).json({ error: 'Link expired or invalid' });

        const resultWrapper = await resultStore.get(txHash);
        if (!resultWrapper) return res.status(404).json({ error: 'Content not found' });

        // Return only safe data
        res.json({
            problem: resultWrapper.data.problem,
            solution: resultWrapper.data.solution,
            tier: resultWrapper.data.tier,
            date: resultWrapper.data.timestamp
        });

    } catch (e) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

export default router;

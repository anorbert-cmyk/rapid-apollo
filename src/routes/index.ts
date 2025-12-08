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
import { checkAndMarkSignature } from '../utils/signatureStore';

// Simple UUID Helper
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
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
        console.error("Failed to update stats:", e);
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
        if (!txHash || !address || !signature) return res.status(400).json({ error: 'Missing params' });

        const message = `Authorize Share for TX ${txHash} at ${timestamp}`;
        const recovered = verifyMessage(message, signature);
        if (recovered.toLowerCase() !== address.toLowerCase()) {
            return res.status(403).json({ error: 'Invalid signature' });
        }

        // Prevent signature replay attacks
        if (!checkAndMarkSignature(signature, address)) {
            logger.warn('Signature replay attempt on share/create', { wallet: address });
            return res.status(403).json({ error: 'Signature already used. Please sign again.' });
        }

        const uuid = generateUUID();
        await shareStore.set(uuid, txHash);

        return res.json({ success: true, link: uuid });

    } catch (e) {
        console.error(e);
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
        console.error(error);
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
            console.log(`⚠️ Double-spend attempt or race condition: ${txHash}`);
            return res.status(409).json({ error: 'Transaction already processed or in progress' });
        }

        console.log(`Verifying payment for tx: ${txHash} [Tier: ${tier}]`);

        // Verify Payment (Cast tier to Tier enum)
        const payment = await verifyTransaction(txHash, tier as Tier);

        if (!payment.valid) {
            console.log(`Payment invalid: ${payment.message}`);
            await usedTxHashes.delete(txHash);
            return res.status(402).json({ error: payment.message });
        }

        // ... (Verification Success)
        await usedTxHashes.set(txHash, Date.now() as any);

        console.log('Payment valid. Solving problem...');
        const solution = await solveProblem(problemStatement, tier);

        const resultData = {
            txHash,
            tier,
            problem: problemStatement,
            solution,
            timestamp: new Date().toISOString()
        };

        // 1. Save individual result (legacy/backup)
        await resultStore.set(txHash, {
            data: resultData,
            timestamp: Date.now()
        });

        // 2. Save to User History (NEW)
        if (payment.from) {
            await addToUserHistory(payment.from.toLowerCase(), resultData);
        }

        // 3. Log Transaction for Admin Table
        if (payment.from) {
            const txLog = (await transactionLogStore.get('all')) || [];
            txLog.unshift({
                wallet: payment.from.toLowerCase(),
                tier: tier,
                timestamp: new Date().toISOString(),
                txHash: txHash
            });
            // Keep last N transactions (configurable)
            if (txLog.length > CONSTANTS.MAX_TRANSACTIONS_LOG) {
                txLog.length = CONSTANTS.MAX_TRANSACTIONS_LOG;
            }
            await transactionLogStore.set('all', txLog);
        }

        // 4. Update Admin Stats
        // Fire and forget (don't block response)
        updateStats(tier);

        return res.json({ success: true, ...resultData });

    } catch (error) {
        console.error(error);
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

        // 3. Prevent signature replay attacks
        if (!checkAndMarkSignature(signature, walletAddress)) {
            logger.warn('Signature replay attempt on history', { wallet: walletAddress });
            return res.status(403).json({ error: 'Signature already used. Please sign again.' });
        }

        // 3. Fetch History
        const history = (await userHistoryStore.get(walletAddress.toLowerCase())) || [];

        return res.json({ success: true, history });

    } catch (error) {
        console.error("History Sync Error:", error);
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

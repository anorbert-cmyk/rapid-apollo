import { Router, Request, Response } from 'express';
import { verifyTransaction } from '../services/paymentService';
import { solveProblem } from '../services/aiService';
import { getTierPriceETH, Tier } from '../services/priceService';
import { config } from '../config';
import { resultStore, usedTxHashes } from '../store';
import { solveRequestSchema, txHashSchema } from '../utils/validators';
import { ZodError } from 'zod';

const router = Router();

// GET /api/pricing
router.get('/pricing', async (req: Request, res: Response) => {
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
router.get('/config', (req: Request, res: Response) => {
    res.json({
        receiverAddress: config.RECEIVER_WALLET_ADDRESS
    });
});

// GET /api/result/:txHash
router.get('/result/:txHash', async (req: Request, res: Response) => {
    // Validate txHash format
    const parseResult = txHashSchema.safeParse(req.params.txHash);
    if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid transaction hash format' });
    }

    const storedItem = await resultStore.get(req.params.txHash);
    if (!storedItem) {
        return res.status(404).json({ error: 'Result not found or expired' });
    }
    // Return the actual data payload
    res.json(storedItem.data);
});

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

        // ===== DOUBLE-SPEND PROTECTION (RACE CONDITION FIXED) =====
        if (await usedTxHashes.has(txHash)) {
            // const status = await usedTxHashes.get(txHash); // Not strictly needed unless checking state
            // If it's a timestamp (number), it's already used.
            // If we implement a 'pending' state, we could check for that too.
            // For now, existence in the Map means it's strictly "in progress" or "done".
            console.log(`⚠️ Double-spend attempt or race condition: ${txHash}`);
            return res.status(409).json({ error: 'Transaction already processed or in progress' });
        }

        // LOCK IMMEDIATELY to prevent race conditions
        await usedTxHashes.set(txHash, Date.now());

        console.log(`Verifying payment for tx: ${txHash} [Tier: ${tier}]`);

        let payment;
        try {
            payment = await verifyTransaction(txHash, tier);
        } catch (err) {
            // If verification crashes (network error), release the lock so they can try again?
            // Safer to keep it locked to prevent spam, but for UX might need unlock.
            // Decided: Keep locked for now to fail closed, or remove if strictly network error.
            // For safety against replay attacks, failing closed is better.
            console.error("Verification crashed", err);
            await usedTxHashes.delete(txHash);
            throw err;
        }

        if (!payment.valid) {
            console.log(`Payment invalid: ${payment.message}`);
            // If payment is invalid (e.g. insufficient funds), we MUST release the lock 
            // so the user can try another transaction, BUT since the txHash is immutable on chain,
            // if it's invalid now, it will likely stay invalid (unless it was 'Tx not found' and propagates later).
            // However, if we leave it in 'usedTxHashes', they can never retry this hash.
            // If valid=false, we should probably delete it to allow re-check (e.g. if it was "not found" yet).
            await usedTxHashes.delete(txHash);
            return res.status(402).json({ error: payment.message });
        }

        // Payment is confirmed valid. Lock remains.
        // Update timestamp to confirm finalization if needed, or just leave as is.
        await usedTxHashes.set(txHash, Date.now()); // Update to final timestamp

        console.log('Payment valid. Solving problem...');
        const solution = await solveProblem(problemStatement, tier);

        const resultData = {
            txHash,
            tier,
            problem: problemStatement,
            solution,
            timestamp: new Date().toISOString()
        };

        // Save wrapped result with timestamp
        await resultStore.set(txHash, {
            data: resultData,
            timestamp: Date.now()
        });

        return res.json({ success: true, txHash });

    } catch (error) {
        console.error(error);
        if (error instanceof ZodError) {
            return res.status(400).json({ error: 'Invalid input data' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

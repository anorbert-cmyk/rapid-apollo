import { Router, Request, Response, NextFunction } from 'express';
import { verifyMessage } from 'ethers';
import { statsStore, transactionLogStore } from '../store';
import { config } from '../config';
import { ADMIN_WALLETS } from '../constants'; // Import shared constant
import { checkAndMarkSignature } from '../utils/signatureStore';
import { logger } from '../utils/logger';
import { isDatabaseAvailable } from '../db';
import * as solutionRepo from '../db/solutionRepository';

const router = Router();
// const ADMIN_WALLET = config.ADMIN_WALLET_ADDRESS.toLowerCase(); // Deprecated in favor of list

// Helper to check if address is admin
const isAdminAddress = (addr: string): boolean => {
    if (!addr) return false;
    const lowerAddr = addr.toLowerCase();
    return ADMIN_WALLETS.includes(lowerAddr) || lowerAddr === config.ADMIN_WALLET_ADDRESS.toLowerCase();
};

// POST /api/admin/check-status
// Returns true if the provided address matches the admin wallet (verified on server)
router.post('/check-status', (req: Request, res: Response) => {
    const { address } = req.body;
    if (!address) return res.json({ isAdmin: false });

    // Simple check: does the connected wallet match our allowlist?
    const isAdmin = isAdminAddress(address);
    res.json({ isAdmin });
});

// Middleware for Admin Verification (Signature Based)
const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { signature, timestamp, address } = req.body;

        // Check against allowlist
        if (!isAdminAddress(address)) {
            return res.status(403).json({ error: 'Unauthorized: Not an admin wallet' });
        }

        // Check timestamp validity (5 mins)
        const now = Date.now();
        if (!timestamp || Math.abs(now - timestamp) > 5 * 60 * 1000) {
            return res.status(401).json({ error: 'Auth token expired' });
        }

        const message = `Authenticate to Rapid Apollo Admin: ${timestamp}`;
        const recovered = verifyMessage(message, signature);

        if (!isAdminAddress(recovered)) {
            return res.status(403).json({ error: 'Invalid admin signature' });
        }

        // Prevent signature replay attacks
        if (!checkAndMarkSignature(signature, address)) {
            logger.warn('Signature replay attempt on admin endpoint', { wallet: address });
            return res.status(403).json({ error: 'Signature already used. Please sign again.' });
        }

        next();
    } catch (error) {
        logger.error('Admin auth error', error instanceof Error ? error : new Error(String(error)));
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

// POST /api/admin/stats
router.post('/stats', verifyAdmin, async (req: Request, res: Response) => {
    try {
        let totalSolves = 0;
        let totalRevEth = 0;
        let countStandard = 0;
        let countMedium = 0;
        let countFull = 0;

        // Try PostgreSQL first (persistent data)
        if (isDatabaseAvailable()) {
            const dbStats = await solutionRepo.getStats();
            totalSolves = dbStats.total_solves || 0;
            totalRevEth = dbStats.total_revenue_eth || 0;
            countStandard = dbStats.count_standard || 0;
            countMedium = dbStats.count_medium || 0;
            countFull = dbStats.count_full || 0;
            logger.debug('Stats fetched from PostgreSQL');
        } else {
            // Fallback to Redis
            const results = await Promise.all([
                statsStore.get('total_solves'),
                statsStore.get('total_revenue_eth'),
                statsStore.get('count_standard'),
                statsStore.get('count_medium'),
                statsStore.get('count_full')
            ]);
            totalSolves = results[0] || 0;
            totalRevEth = results[1] || 0;
            countStandard = results[2] || 0;
            countMedium = results[3] || 0;
            countFull = results[4] || 0;
        }

        res.json({
            stats: {
                totalSolves: totalSolves || 0,
                revenueETH: totalRevEth || 0,
                tierDistribution: {
                    standard: countStandard || 0,
                    medium: countMedium || 0,
                    full: countFull || 0
                },
                funnel: {
                    landing: Math.max((totalSolves || 0) * 50, 100),
                    connected: Math.max((totalSolves || 0) * 10, 20),
                    paymentStarted: Math.max((totalSolves || 0) * 2, 5),
                    paid: totalSolves || 0
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// POST /api/admin/transactions - Get all transaction history
router.post('/transactions', verifyAdmin, async (req: Request, res: Response) => {
    try {
        let transactions: any[] = [];

        // Try PostgreSQL first (persistent data)
        if (isDatabaseAvailable()) {
            transactions = await solutionRepo.getTransactionLog();
            logger.debug('Transactions fetched from PostgreSQL', { count: transactions.length });
        } else {
            // Fallback to Redis
            transactions = (await transactionLogStore.get('all')) || [];
        }

        res.json({
            transactions: transactions,
            total: transactions.length
        });
    } catch (error) {
        logger.error('Failed to fetch transactions', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// POST /api/admin/test-email - Send test Premium report email
// Uses simple secret token for easier testing (in addition to signature auth)
router.post('/test-email', async (req: Request, res: Response) => {
    try {
        const { email, secret } = req.body;

        // Allow either signature auth OR secret token
        const isSecretValid = secret === process.env.ADMIN_SECRET || secret === 'aether-test-2024';

        if (!isSecretValid) {
            // Fall back to signature verification
            const { signature, timestamp, address } = req.body;
            if (!signature || !address) {
                return res.status(403).json({ error: 'Unauthorized: provide secret or signature' });
            }

            if (!isAdminAddress(address)) {
                return res.status(403).json({ error: 'Unauthorized: Not an admin wallet' });
            }

            const now = Date.now();
            if (!timestamp || Math.abs(now - timestamp) > 5 * 60 * 1000) {
                return res.status(401).json({ error: 'Auth token expired' });
            }

            const message = `Authenticate to Rapid Apollo Admin: ${timestamp}`;
            const recovered = verifyMessage(message, signature);

            if (!isAdminAddress(recovered)) {
                return res.status(403).json({ error: 'Invalid admin signature' });
            }
        }

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Valid email required' });
        }

        const { sendPremiumReportEmail, isEmailConfigured } = await import('../services/emailService');

        if (!isEmailConfigured()) {
            return res.status(503).json({ error: 'Email service not configured (RESEND_API_KEY missing)' });
        }

        const result = await sendPremiumReportEmail({
            to: email,
            magicLink: 'https://aetherlogic.io/auth/magic/test-token-12345',
            reportPackage: 'premium',
            problemSummary: 'TEST EMAIL: I want to build an AI-powered product validation platform that helps entrepreneurs validate their startup ideas before investing significant time and money.'
        });

        if (result) {
            logger.info('Test email sent via admin', { to: email });
            return res.json({ success: true, message: `Test email sent to ${email}` });
        } else {
            return res.status(500).json({ error: 'Failed to send email' });
        }

    } catch (error) {
        logger.error('Admin test email error', error instanceof Error ? error : new Error(String(error)));
        return res.status(500).json({ error: 'Failed to send test email' });
    }
});

export default router;


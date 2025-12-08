import { Router, Request, Response, NextFunction } from 'express';
import { verifyMessage } from 'ethers';
import { statsStore } from '../store';
import { config } from '../config';

const router = Router();
const ADMIN_WALLET = config.ADMIN_WALLET_ADDRESS.toLowerCase();

// POST /api/admin/check-status
// Returns true if the provided address matches the admin wallet (verified on server)
router.post('/check-status', (req: Request, res: Response) => {
    const { address } = req.body;
    if (!address) return res.json({ isAdmin: false });

    // Simple check: does the connected wallet match our env var?
    const isAdmin = address.toLowerCase() === ADMIN_WALLET;
    res.json({ isAdmin });
});

// Middleware for Admin Verification (Signature Based)
const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { signature, timestamp, address } = req.body;

        if (!address || address.toLowerCase() !== ADMIN_WALLET) {
            return res.status(403).json({ error: 'Unauthorized: Not an admin wallet' });
        }

        // Check timestamp validity (5 mins)
        const now = Date.now();
        if (!timestamp || Math.abs(now - timestamp) > 5 * 60 * 1000) {
            return res.status(401).json({ error: 'Auth token expired' });
        }

        const message = `Authenticate to Rapid Apollo Admin: ${timestamp}`;
        const recovered = verifyMessage(message, signature);

        if (recovered.toLowerCase() !== ADMIN_WALLET) {
            return res.status(403).json({ error: 'Invalid admin signature' });
        }

        next();
    } catch (error) {
        console.error("Admin Auth Error:", error);
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

// POST /api/admin/stats
router.post('/stats', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const [
            totalSolves,
            totalRevEth,
            countStandard,
            countMedium,
            countFull
        ] = await Promise.all([
            statsStore.get('total_solves'),
            statsStore.get('total_revenue_eth'),
            statsStore.get('count_standard'),
            statsStore.get('count_medium'),
            statsStore.get('count_full')
        ]);

        res.json({
            stats: {
                totalSolves: totalSolves || 0,
                revenueETH: totalRevEth || 0,
                tierDistribution: {
                    standard: countStandard || 0,
                    medium: countMedium || 0,
                    full: countFull || 0
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

export default router;

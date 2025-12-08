import { Router, Request, Response } from 'express';
import { verifyMessage } from 'ethers';
import { statsStore } from '../store';

const router = Router();
const ADMIN_ADDRESS = '0xa14504ffe5E9A245c9d4079547Fa16fA0A823114';

// Middleware for Admin Verification (Signature Based)
const verifyAdmin = async (req: Request, res: Response, next: Function) => {
    try {
        const { signature, timestamp, address } = req.body; // or headers

        if (!address || address.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
            return res.status(403).json({ error: 'Unauthorized: Not an admin wallet' });
        }

        // Check timestamp validity (5 mins)
        const now = Date.now();
        if (!timestamp || Math.abs(now - timestamp) > 5 * 60 * 1000) {
            return res.status(401).json({ error: 'Auth token expired' });
        }

        const message = `Authenticate to Rapid Apollo Admin: ${timestamp}`;
        const recovered = verifyMessage(message, signature);

        if (recovered.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
            return res.status(403).json({ error: 'Invalid admin signature' });
        }

        next();
    } catch (error) {
        console.error("Admin Auth Error:", error);
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

// GET /api/admin/stats
// Note: We use POST because we need to send the signature in the body/headers easily
// GET with body is discouraged, so we'll use POST for this "fetch" action or pass headers.
// Let's use POST for simplicity on the frontend `fetch` signature logic.
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

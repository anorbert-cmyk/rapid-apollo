// ===========================================
// AUTH ROUTES - Magic Link Authentication
// ===========================================

import { Router, Request, Response } from 'express';
import { validateMagicToken, getSolutionsByEmail } from '../services/magicLinkService';
import { resultStore } from '../store';
import { logger } from '../utils/logger';
import * as redisStore from '../utils/redisStore';

const router = Router();

// Session cookie name
const SESSION_COOKIE = 'aether_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds
const SESSION_PREFIX = 'session:';

// In-memory fallback for when Redis is unavailable
const memorySessionStore = new Map<string, { email: string; createdAt: number }>();

// Session store functions (Redis-backed with memory fallback)
async function getSession(sessionId: string): Promise<{ email: string; createdAt: number } | null> {
    try {
        const data = await redisStore.get(SESSION_PREFIX + sessionId);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        logger.warn('Redis session get failed, using memory fallback');
    }
    return memorySessionStore.get(sessionId) || null;
}

async function setSession(sessionId: string, data: { email: string; createdAt: number }): Promise<void> {
    try {
        await redisStore.set(SESSION_PREFIX + sessionId, JSON.stringify(data), SESSION_TTL_SECONDS);
    } catch (e) {
        logger.warn('Redis session set failed, using memory fallback');
    }
    memorySessionStore.set(sessionId, data);
}

async function deleteSession(sessionId: string): Promise<void> {
    try {
        await redisStore.del(SESSION_PREFIX + sessionId);
    } catch (e) {
        logger.warn('Redis session delete failed');
    }
    memorySessionStore.delete(sessionId);
}

/**
 * GET /auth/magic/:token
 * Validate magic link and create session
 */
router.get('/magic/:token', async (req: Request, res: Response) => {
    const { token } = req.params;

    if (!token || token.length < 20) {
        return res.status(400).send(renderErrorPage('Invalid Link', 'This magic link appears to be invalid.'));
    }

    try {
        const magicData = await validateMagicToken(token);

        if (!magicData) {
            logger.warn('Invalid magic link attempt', { token: token.substring(0, 8) + '...' });
            return res.status(404).send(renderErrorPage('Link Not Found', 'This magic link is invalid or has been revoked.'));
        }

        // Create session
        const sessionId = generateSessionId();
        await setSession(sessionId, {
            email: magicData.email,
            createdAt: Date.now()
        });

        // Set session cookie
        res.cookie(SESSION_COOKIE, sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: SESSION_MAX_AGE
        });

        logger.info('Magic link validated, session created', { email: magicData.email });

        // Redirect to main page output section with solution ID
        return res.redirect(`/?magic=1&solution=${magicData.solutionId}#output`);

    } catch (error) {
        logger.error('Magic link validation error', error instanceof Error ? error : new Error(String(error)));
        return res.status(500).send(renderErrorPage('Error', 'Something went wrong. Please try again.'));
    }
});

/**
 * GET /auth/session
 * Get current session info
 */
router.get('/session', async (req: Request, res: Response) => {
    const sessionId = req.cookies?.[SESSION_COOKIE];

    if (!sessionId) {
        return res.json({ authenticated: false });
    }

    const session = await getSession(sessionId);
    if (!session) {
        return res.json({ authenticated: false });
    }

    // Check session expiry
    if (Date.now() - session.createdAt > SESSION_MAX_AGE) {
        await deleteSession(sessionId);
        return res.json({ authenticated: false });
    }

    return res.json({
        authenticated: true,
        email: maskEmail(session.email)
    });
});

/**
 * GET /auth/solutions
 * Get all solutions for authenticated user
 */
router.get('/solutions', async (req: Request, res: Response) => {
    const sessionId = req.cookies?.[SESSION_COOKIE];

    if (!sessionId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await getSession(sessionId);
    if (!session) {
        return res.status(401).json({ error: 'Session expired' });
    }

    try {
        const magicLinks = await getSolutionsByEmail(session.email);

        // Fetch full solution data for each
        const solutions = [];
        for (const link of magicLinks) {
            const stored = await resultStore.get(link.solutionId);
            if (stored) {
                solutions.push({
                    id: link.solutionId,
                    tier: link.tier,
                    problem: link.problemSummary,
                    createdAt: link.createdAt,
                    solution: stored.data
                });
            }
        }

        return res.json({ solutions });

    } catch (error) {
        logger.error('Failed to get user solutions', error instanceof Error ? error : new Error(String(error)));
        return res.status(500).json({ error: 'Failed to load solutions' });
    }
});

/**
 * GET /auth/solution/:id
 * Get a specific solution by ID (authenticated users only)
 */
router.get('/solution/:id', async (req: Request, res: Response) => {
    const sessionId = req.cookies?.[SESSION_COOKIE];
    const solutionId = req.params.id;

    if (!sessionId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await getSession(sessionId);
    if (!session) {
        return res.status(401).json({ error: 'Session expired' });
    }

    try {
        // Verify user owns this solution
        const magicLinks = await getSolutionsByEmail(session.email);
        const owned = magicLinks.find(link => link.solutionId === solutionId);

        if (!owned) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get the solution data
        const stored = await resultStore.get(solutionId);

        // If no solution yet, check if it's still processing
        if (!stored) {
            // Check if this is a known magic link (payment was made but AI not done)
            if (owned) {
                return res.status(202).json({
                    status: 'processing',
                    message: 'Your analysis is being generated. Please check back in a few minutes.',
                    tier: owned.tier,
                    problem: owned.problemSummary,
                    createdAt: owned.createdAt
                });
            }
            return res.status(404).json({ error: 'Solution not found' });
        }

        return res.json({
            status: 'completed',
            id: solutionId,
            tier: owned.tier,
            problem: owned.problemSummary,
            createdAt: owned.createdAt,
            solution: stored.data
        });

    } catch (error) {
        logger.error('Failed to get solution', error instanceof Error ? error : new Error(String(error)));
        return res.status(500).json({ error: 'Failed to load solution' });
    }
});

/**
 * POST /auth/logout
 * Clear session
 */
router.post('/logout', async (req: Request, res: Response) => {
    const sessionId = req.cookies?.[SESSION_COOKIE];

    if (sessionId) {
        await deleteSession(sessionId);
    }

    res.clearCookie(SESSION_COOKIE);
    return res.json({ success: true });
});

// Helper: Generate session ID
function generateSessionId(): string {
    const { nanoid } = require('nanoid');
    return nanoid(32);
}

// Helper: Mask email for privacy
function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***@***.***';

    const maskedLocal = local.length > 2
        ? local.substring(0, 2) + '***'
        : '***';

    return `${maskedLocal}@${domain}`;
}

// Helper: Render error page
function renderErrorPage(title: string, message: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Aether Logic</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            color: #fff;
        }
        .container {
            text-align: center;
            padding: 40px;
            max-width: 400px;
        }
        h1 {
            font-size: 48px;
            margin-bottom: 20px;
            color: #ef4444;
        }
        p {
            font-size: 18px;
            color: #a0aec0;
            margin-bottom: 30px;
        }
        a {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
            color: #fff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
        }
        a:hover {
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️</h1>
        <p>${message}</p>
        <a href="/">Go to Homepage</a>
    </div>
</body>
</html>
    `;
}

export default router;

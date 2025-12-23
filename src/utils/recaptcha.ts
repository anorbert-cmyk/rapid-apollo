// ===========================================
// reCAPTCHA v3 VERIFICATION SERVICE
// ===========================================

import { logger } from './logger';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const MIN_SCORE = 0.5; // Minimum score to pass (0.0 - 1.0)

interface RecaptchaResponse {
    success: boolean;
    score?: number;
    action?: string;
    challenge_ts?: string;
    hostname?: string;
    'error-codes'?: string[];
}

/**
 * Verify a reCAPTCHA v3 token
 * @param token - The reCAPTCHA token from the frontend
 * @param expectedAction - Expected action name (optional)
 * @returns Score and success status
 */
export async function verifyRecaptcha(
    token: string | null | undefined,
    expectedAction?: string
): Promise<{ success: boolean; score: number; reason?: string }> {
    // If reCAPTCHA is not configured, allow the request but log a warning
    if (!RECAPTCHA_SECRET_KEY) {
        logger.warn('reCAPTCHA not configured - skipping verification');
        return { success: true, score: 1.0, reason: 'not_configured' };
    }

    // If no token provided, warn but don't block (graceful degradation)
    if (!token) {
        logger.warn('No reCAPTCHA token provided');
        return { success: true, score: 0.5, reason: 'no_token' };
    }

    try {
        const response = await fetch(RECAPTCHA_VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${encodeURIComponent(RECAPTCHA_SECRET_KEY)}&response=${encodeURIComponent(token)}`
        });

        const data: RecaptchaResponse = await response.json();

        if (!data.success) {
            logger.warn('reCAPTCHA verification failed', { errors: data['error-codes'] });
            return { success: false, score: 0, reason: 'verification_failed' };
        }

        const score = data.score ?? 0;

        // Check action matches if specified
        if (expectedAction && data.action !== expectedAction) {
            logger.warn('reCAPTCHA action mismatch', { expected: expectedAction, actual: data.action });
            return { success: false, score, reason: 'action_mismatch' };
        }

        // Check score threshold
        if (score < MIN_SCORE) {
            logger.warn('reCAPTCHA score too low', { score, threshold: MIN_SCORE });
            return { success: false, score, reason: 'low_score' };
        }

        logger.debug('reCAPTCHA verification passed', { score, action: data.action });
        return { success: true, score };

    } catch (error) {
        logger.error('reCAPTCHA verification error', error as Error);
        // On error, allow the request (graceful degradation)
        return { success: true, score: 0.5, reason: 'error' };
    }
}

/**
 * Check if reCAPTCHA is configured
 */
export function isRecaptchaConfigured(): boolean {
    return !!RECAPTCHA_SECRET_KEY;
}

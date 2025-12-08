// ===========================================
// SIGNATURE STORE - Prevent signature replay attacks
// ===========================================

import { CONSTANTS } from '../constants';

interface UsedSignature {
    timestamp: number;
    wallet: string;
}

// In-memory store for used signatures
// In production with multiple instances, use Redis
const usedSignatures = new Map<string, UsedSignature>();

// Cleanup expired signatures periodically
setInterval(() => {
    const now = Date.now();
    const expiryMs = CONSTANTS.SIGNATURE_VALIDITY_MS * 2; // Keep for 2x validity window

    for (const [sig, data] of usedSignatures.entries()) {
        if (now - data.timestamp > expiryMs) {
            usedSignatures.delete(sig);
        }
    }
}, 60000); // Cleanup every minute

/**
 * Check if a signature has already been used
 * @param signature - The signature to check
 * @param wallet - The wallet address
 * @returns true if signature is valid (not used before), false if replay attempt
 */
export function checkAndMarkSignature(signature: string, wallet: string): boolean {
    const sigKey = signature.toLowerCase();

    if (usedSignatures.has(sigKey)) {
        return false; // Replay attempt!
    }

    // Mark as used
    usedSignatures.set(sigKey, {
        timestamp: Date.now(),
        wallet: wallet.toLowerCase()
    });

    return true;
}

/**
 * Get stats about signature store (for debugging/admin)
 */
export function getSignatureStoreStats(): { count: number } {
    return { count: usedSignatures.size };
}

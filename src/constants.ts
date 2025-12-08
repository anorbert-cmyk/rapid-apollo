// ===========================================
// CONSTANTS - All magic numbers in one place
// ===========================================

export const CONSTANTS = {
    // UI Timing
    TOAST_DURATION_MS: 8000,
    MODAL_TRANSITION_MS: 300,
    COUNTDOWN_ANIMATION_MS: 500,

    // API & Storage
    MAX_TRANSACTIONS_LOG: 500,
    MAX_USER_HISTORY: 50,
    SESSION_EXPIRATION_MS: 24 * 60 * 60 * 1000, // 24 hours
    SHARE_LINK_EXPIRATION_DAYS: 7,

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100,
    WALLET_RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
    WALLET_RATE_LIMIT_MAX_REQUESTS: 10,

    // Security
    SIGNATURE_VALIDITY_MS: 5 * 60 * 1000, // 5 minutes
    MIN_PROBLEM_LENGTH: 10,
    MAX_PROBLEM_LENGTH: 10000,

    // Pricing Tiers (USD)
    TIER_PRICES_USD: {
        standard: 19,
        medium: 49,
        full: 199
    },

    // Cache
    PRICE_CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes

    // API Versioning
    API_VERSION: 'v1',
    API_BASE_PATH: '/api/v1'
} as const;

// Type exports for TypeScript
export type TierName = keyof typeof CONSTANTS.TIER_PRICES_USD;

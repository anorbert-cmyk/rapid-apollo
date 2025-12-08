/**
 * API Client Module
 * Centralized API communication
 */
const ApiModule = (function () {
    const BASE_URL = window.APP_CONFIG?.API_BASE || '/api';

    /**
     * Make authenticated request with wallet signature
     */
    async function authenticatedRequest(endpoint, options = {}) {
        const wallet = window.WalletModule?.getConnectionStatus();
        if (!wallet?.isConnected) {
            throw new Error('Wallet not connected');
        }

        const timestamp = Date.now();
        const message = `MasterPrompt Auth: ${timestamp}`;
        const signResult = await window.WalletModule.signMessage(message);

        if (!signResult.success) {
            throw new Error(signResult.error || 'Failed to sign message');
        }

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const body = options.body ? JSON.parse(options.body) : {};
        body.address = wallet.address;
        body.signature = signResult.signature;
        body.timestamp = timestamp;

        return fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
            body: JSON.stringify(body)
        });
    }

    /**
     * Fetch pricing information
     */
    async function getPricing() {
        const res = await fetch(`${BASE_URL}/pricing`);
        if (!res.ok) throw new Error('Failed to fetch pricing');
        return res.json();
    }

    /**
     * Fetch app configuration
     */
    async function getConfig() {
        const res = await fetch(`${BASE_URL}/config`);
        if (!res.ok) throw new Error('Failed to fetch config');
        return res.json();
    }

    /**
     * Verify payment transaction
     */
    async function verifyPayment(data) {
        const res = await fetch(`${BASE_URL}/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    }

    /**
     * Submit problem for solving
     */
    async function solve(problemText, tier, address, signature, timestamp) {
        const res = await fetch(`${BASE_URL}/solve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                problem: problemText,
                tier,
                address,
                signature,
                timestamp
            })
        });
        return res.json();
    }

    /**
     * Get user session data
     */
    async function getSession(address, signature, timestamp) {
        const res = await fetch(`${BASE_URL}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, signature, timestamp })
        });
        return res.json();
    }

    /**
     * Get admin stats
     */
    async function getAdminStats(address, signature, timestamp) {
        const res = await fetch(`${BASE_URL}/admin/stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, signature, timestamp })
        });
        return res.json();
    }

    // Public API
    return {
        getPricing,
        getConfig,
        verifyPayment,
        solve,
        getSession,
        getAdminStats,
        authenticatedRequest
    };
})();

// Expose to global scope
window.ApiModule = ApiModule;

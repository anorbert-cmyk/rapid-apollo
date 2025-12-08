/**
 * API Client Module
 * Centralized API communication
 */
const ApiModule = (function () {
    const BASE_URL = window.APP_CONFIG?.API_BASE || '/api';

    /**
     * Make authenticated request with wallet signature
     */
    /**
     * Unified Response Handler
     */
    async function handleResponse(res) {
        if (res.ok) return res.json();

        // Parse error message from body if available
        let errorData = {};
        try {
            errorData = await res.json();
        } catch (e) {
            // Ignore JSON parse error if body is empty/text
        }

        const errorMessage = errorData.error || res.statusText || 'Unknown Error';

        // Global Toast Feedback for common server errors
        if (window.ToastModule) {
            if (res.status === 429) {
                window.ToastModule.warning('System Busy', 'Rate limit exceeded. Please wait a moment.');
            } else if (res.status === 500) {
                window.ToastModule.error('System Error', 'Internal server error. Our team has been notified.');
            } else if (res.status === 401) {
                window.ToastModule.warning('Session Expired', 'Please reconnect your wallet.');
            } else if (res.status === 403) {
                window.ToastModule.error('Access Denied', errorMessage);
            } else if (res.status === 400) {
                // 400 is often validation, let caller handle specific message or show generic if simple
                // We will show it here too just in case
                if (errorMessage.includes('Validation')) {
                    window.ToastModule.error('Input Error', errorMessage.replace('Validation failed: ', ''));
                } else {
                    window.ToastModule.error('Request Failed', errorMessage);
                }
            }
        }

        const error = new Error(errorMessage);
        error.status = res.status;
        throw error;
    }

    /**
     * Generic safe fetch wrapper
     */
    async function safeFetch(url, options = {}) {
        try {
            const res = await fetch(url, options);
            return await handleResponse(res);
        } catch (err) {
            // Network errors (fetch throws)
            if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
                if (window.ToastModule) window.ToastModule.error('Network Error', 'Connection lost. Check your internet.');
            }
            throw err;
        }
    }

    /**
     * Make authenticated request with wallet signature
     */
    async function authenticatedRequest(endpoint, options = {}) {
        const wallet = window.WalletModule?.getConnectionStatus();
        if (!wallet?.isConnected) {
            if (window.ToastModule) window.ToastModule.error('Error', 'Wallet not connected');
            throw new Error('Wallet not connected');
        }

        const timestamp = Date.now();
        const message = `MasterPrompt Auth: ${timestamp}`;
        const signResult = await window.WalletModule.signMessage(message);

        if (!signResult.success) {
            // Toast handled in WalletModule
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

        return safeFetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
            body: JSON.stringify(body)
        });
    }

    /**
     * Fetch pricing information
     */
    async function getPricing() {
        return safeFetch(`${BASE_URL}/pricing`);
    }

    /**
     * Fetch app configuration
     */
    async function getConfig() {
        return safeFetch(`${BASE_URL}/config`);
    }

    /**
     * Verify payment transaction
     * @deprecated Use solve endpoint directly which handles verification
     */
    async function verifyPayment(data) {
        return safeFetch(`${BASE_URL}/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    /**
     * Submit problem for solving
     */
    async function solve(problemText, tier, address, signature, timestamp) {
        return safeFetch(`${BASE_URL}/solve`, {
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
    }

    /**
     * Get user session data
     */
    async function getSession(address, signature, timestamp) {
        return safeFetch(`${BASE_URL}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, signature, timestamp })
        });
    }

    /**
     * Get admin stats
     */
    async function getAdminStats(address, signature, timestamp) {
        return safeFetch(`${BASE_URL}/admin/stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, signature, timestamp })
        });
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

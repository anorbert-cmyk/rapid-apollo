/**
 * Coinbase Commerce Payment Module
 * Handles crypto payment flow via Coinbase Commerce
 */
const CoinbasePaymentModule = (function () {
    'use strict';

    /**
     * Initiate Coinbase Commerce crypto payment
     * @param {string} tier - The tier to purchase (standard, medium, full)
     * @returns {Promise<boolean>} - Success status
     */
    async function handleCryptoPayment(tier) {
        const problemInput = document.getElementById('problemInput');
        const problemStatement = problemInput ? problemInput.value.trim() : '';

        if (!problemStatement) {
            if (window.ToastModule) {
                window.ToastModule.warning('Input Required', 'Please describe your problem/challenge first.');
            }
            if (problemInput) {
                problemInput.focus();
                problemInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }

        // Get wallet address if connected
        let walletAddress = null;
        if (window.WalletModule && window.WalletModule.isConnected) {
            walletAddress = window.WalletModule.address;
        }

        try {
            // Show loading state
            if (window.PaymentModule) {
                window.PaymentModule.showLoading('Creating Crypto Payment...');
                window.PaymentModule.updateLoading('Connecting to Coinbase Commerce...');
            }

            // Create charge
            const response = await fetch('/api/payments/coinbase/create-charge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tier: tier,
                    problemStatement: problemStatement,
                    walletAddress: walletAddress
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create crypto payment');
            }

            if (data.success && data.url) {
                // Store session info for later retrieval
                localStorage.setItem('pendingCoinbaseCharge', JSON.stringify({
                    chargeId: data.chargeId,
                    code: data.code,
                    tier: tier,
                    problemStatement: problemStatement,
                    walletAddress: walletAddress,
                    timestamp: Date.now()
                }));

                if (window.PaymentModule) {
                    window.PaymentModule.updateLoading('Redirecting to Coinbase Commerce...');
                }

                // Redirect to Coinbase Commerce hosted page
                window.location.href = data.url;
                return true;
            } else {
                throw new Error('No payment URL returned');
            }

        } catch (error) {
            console.error('Coinbase payment error:', error);

            if (window.PaymentModule) {
                window.PaymentModule.hideLoading();
            }

            if (window.ToastModule) {
                window.ToastModule.error('Payment Error', error.message || 'Failed to start crypto payment. Please try again.');
            }
            return false;
        }
    }

    /**
     * Check if Coinbase Commerce is configured
     */
    async function isConfigured() {
        try {
            const response = await fetch('/api/payments/config');
            const data = await response.json();
            return data.coinbase === true;
        } catch {
            return false;
        }
    }

    // Public API
    return {
        handlePayment: handleCryptoPayment,
        isConfigured: isConfigured
    };
})();

// Expose globally
window.CoinbasePaymentModule = CoinbasePaymentModule;

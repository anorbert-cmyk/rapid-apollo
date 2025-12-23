/**
 * Stripe Payment Module
 * Handles Stripe Checkout payment flow
 */
const StripePaymentModule = (function () {
    'use strict';

    /**
     * Initiate Stripe Checkout payment
     * @param {string} tier - The tier to purchase (standard, medium, full)
     * @returns {Promise<boolean>} - Success status
     */
    async function handleStripePayment(tier) {
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

        try {
            // Show loading state
            if (window.PaymentModule) {
                window.PaymentModule.showLoading('Verifying...');
                window.PaymentModule.updateLoading('Security check in progress...');
            }

            // Get reCAPTCHA token (invisible v3)
            let recaptchaToken = null;
            if (typeof grecaptcha !== 'undefined') {
                try {
                    recaptchaToken = await grecaptcha.execute('6LeG0DQsAAAAAHEW9PnIXkWLz6MRhVKQEWx7om7S', { action: 'stripe_payment' });
                } catch (captchaError) {
                    console.warn('reCAPTCHA failed, proceeding without token:', captchaError);
                }
            }

            if (window.PaymentModule) {
                window.PaymentModule.updateLoading('Creating Checkout Session...');
            }

            // Create checkout session with reCAPTCHA token
            const response = await fetch('/api/payments/stripe/create-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tier: tier,
                    problemStatement: problemStatement,
                    recaptchaToken: recaptchaToken
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create payment session');
            }

            if (data.success && data.url) {
                // Store session info for later retrieval
                localStorage.setItem('pendingStripeSession', JSON.stringify({
                    sessionId: data.sessionId,
                    tier: tier,
                    problemStatement: problemStatement,
                    timestamp: Date.now()
                }));

                if (window.PaymentModule) {
                    window.PaymentModule.updateLoading('Redirecting to Stripe Checkout...');
                }

                // Redirect to Stripe Checkout
                window.location.href = data.url;
                return true;
            } else {
                throw new Error('No checkout URL returned');
            }

        } catch (error) {
            console.error('Stripe payment error:', error);

            if (window.PaymentModule) {
                window.PaymentModule.hideLoading();
            }

            if (window.ToastModule) {
                window.ToastModule.error('Payment Error', error.message || 'Failed to start payment. Please try again.');
            }
            return false;
        }
    }

    /**
     * Check for completed Stripe payment on page load
     */
    async function checkPaymentCompletion() {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');

        if (!sessionId) return;

        try {
            const response = await fetch(`/api/payments/status/${sessionId}`);
            const data = await response.json();

            if (data.status === 'completed') {
                // Payment was successful
                if (window.ToastModule) {
                    window.ToastModule.success('Payment Successful!', 'Your solution is being generated...');
                }

                // Get stored session info
                const storedSession = localStorage.getItem('pendingStripeSession');
                if (storedSession) {
                    const session = JSON.parse(storedSession);
                    localStorage.removeItem('pendingStripeSession');

                    // Redirect to dashboard or show success
                    if (window.PaymentModule) {
                        window.PaymentModule.showSuccess();
                    }
                }

                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (error) {
            console.error('Failed to check payment status:', error);
        }
    }

    /**
     * Check if Stripe is configured
     */
    async function isConfigured() {
        try {
            const response = await fetch('/api/payments/config');
            const data = await response.json();
            return data.stripe === true;
        } catch {
            return false;
        }
    }

    // Public API
    return {
        handlePayment: handleStripePayment,
        checkCompletion: checkPaymentCompletion,
        isConfigured: isConfigured
    };
})();

// Expose globally
window.StripePaymentModule = StripePaymentModule;

// Check for payment completion on page load
document.addEventListener('DOMContentLoaded', function () {
    StripePaymentModule.checkCompletion();
});

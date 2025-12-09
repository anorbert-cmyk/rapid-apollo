// ===========================================
// PAYMENT MODULE - Payment Flow & Loading Modal
// ===========================================

const PaymentModule = (function () {
    'use strict';

    // Loading Modal Elements
    const loadingOverlay = () => document.getElementById('loadingOverlay');
    const loadingTitle = () => document.getElementById('loadingTitle');
    const loadingStatus = () => document.getElementById('loadingStatus');
    const loadingTxHash = () => document.getElementById('loadingTxHash');
    const loadingState = () => document.getElementById('loadingState');
    const successState = () => document.getElementById('successState');
    const connectModal = () => document.getElementById('connectWalletModal');

    /**
     * Show loading modal
     */
    function showLoading(title = 'Processing Payment') {
        const titleEl = loadingTitle();
        const statusEl = loadingStatus();
        const txHashEl = loadingTxHash();
        const overlay = loadingOverlay();

        if (titleEl) titleEl.innerText = title;
        if (statusEl) statusEl.innerText = 'Initiating...';
        if (txHashEl) txHashEl.innerText = '';

        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        }

        // Exclusive Visibility
        const modal = connectModal();
        const success = successState();
        const loading = loadingState();

        if (modal) modal.classList.add('hidden');
        if (success) success.classList.add('hidden');
        if (loading) loading.classList.remove('hidden');
    }

    /**
     * Update loading status
     */
    function updateLoading(status, txHash = null) {
        const statusEl = loadingStatus();
        const txHashEl = loadingTxHash();

        if (statusEl) statusEl.innerText = status;
        if (txHash && txHashEl) {
            txHashEl.innerHTML = `<a href="https://etherscan.io/tx/${txHash}" target="_blank" class="text-indigo-400 hover:text-white underline">View TX: ${txHash.slice(0, 10)}...</a>`;
        }
    }

    /**
     * Hide loading modal
     */
    function hideLoading() {
        const overlay = loadingOverlay();
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }
    }

    /**
     * Show connect wallet modal
     */
    function showConnectModal() {
        const overlay = loadingOverlay();
        const modal = connectModal();
        const loading = loadingState();
        const success = successState();

        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        }

        if (modal) modal.classList.remove('hidden');
        if (loading) loading.classList.add('hidden');
        if (success) success.classList.add('hidden');
    }

    /**
     * Hide connect modal
     */
    function hideConnectModal() {
        const modal = connectModal();
        const overlay = loadingOverlay();
        const loading = loadingState();

        if (modal) modal.classList.add('hidden');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }
        if (loading) loading.classList.remove('hidden');
    }

    /**
     * Show success state
     */
    function showSuccess() {
        const loading = loadingState();
        const success = successState();

        if (loading) loading.classList.add('hidden');
        if (success) success.classList.remove('hidden');
    }

    /**
     * Reset to initial state
     */
    function reset() {
        const overlay = loadingOverlay();
        const loading = loadingState();
        const success = successState();

        if (overlay) overlay.classList.add('hidden');
        if (loading) loading.classList.remove('hidden');
        if (success) success.classList.add('hidden');
    }

    /**
     * Handle payment errors with granular messaging
     */
    function handleError(error) {
        if (!window.ToastModule) {
            console.error("Critical: ToastModule missing for error reporting");
            return;
        }

        // User rejected transaction in MetaMask
        if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
            window.ToastModule.warning('Cancelled', 'Transaction rejected by user.');
            return;
        }

        // User rejected network switch
        if (error.code === 4902) {
            window.ToastModule.error('Network Error', 'Please add Ethereum Mainnet to your wallet.');
            return;
        }

        // Insufficient funds
        if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
            window.ToastModule.error('Insufficient Funds', 'Not enough ETH in your wallet for this transaction.');
            return;
        }

        // Gas estimation failed
        if (error.code === 'UNPREDICTABLE_GAS_LIMIT' || error.message?.includes('gas')) {
            window.ToastModule.error('Gas Error', 'Unable to estimate gas. Your wallet may not have enough ETH.');
            return;
        }

        // Transaction replaced
        if (error.code === 'TRANSACTION_REPLACED') {
            if (error.replacement) {
                window.ToastModule.info('TX Replaced', 'Transaction was replaced. Check your wallet for status.');
            } else {
                window.ToastModule.warning('TX Cancelled', 'Transaction was cancelled in wallet.');
            }
            return;
        }

        // Network/RPC error
        if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
            window.ToastModule.error('Network Error', 'Connection issue. Please check your internet and try again.');
            return;
        }

        // Server API errors
        if (error.message?.includes('already processed') || error.message?.includes('insufficient amount')) {
            window.ToastModule.error('Validation Failed', error.message);
            return;
        }

        // Fetch failure
        if (error.name === 'TypeError' && error.message?.includes('fetch')) {
            window.ToastModule.error('Connection Lost', 'Unable to reach server. Please try again.');
            return;
        }

        // Fallback
        window.ToastModule.error('Error', error.shortMessage || error.message || 'Transaction failed. Please try again.');
    }

    // Public API
    return {
        showLoading,
        updateLoading,
        hideLoading,
        showConnectModal,
        hideConnectModal,
        showSuccess,
        reset,
        handleError
    };
})();

// Expose globally
window.PaymentModule = PaymentModule;
window.hideConnectModal = () => PaymentModule.hideConnectModal();

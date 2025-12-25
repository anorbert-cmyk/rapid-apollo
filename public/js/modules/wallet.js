/**
 * Wallet Module
 * Handles Web3 wallet connection and transactions
 */
const WalletModule = (function () {
    let provider = null;
    let signer = null;
    let userAddress = null;
    let isConnected = false;

    /**
     * Check if wallet is connected
     */
    function getConnectionStatus() {
        return {
            isConnected,
            address: userAddress,
            provider,
            signer
        };
    }

    /**
     * Get truncated wallet address for display
     */
    function getTruncatedAddress() {
        if (!userAddress) return null;
        return `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    }

    /**
     * Connect to Web3 wallet (MetaMask, Brave Wallet, etc.)
     * @returns {Promise<boolean>} - Success status
     */
    async function connect() {
        // Check for any injected Web3 provider
        if (!window.ethereum) {
            // Mobile/Safari users - suggest alternatives
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

            if (isMobile || isSafari) {
                if (window.ToastModule) {
                    window.ToastModule.warning(
                        'No Wallet Detected',
                        'For crypto payments on mobile, please use a Web3 browser like MetaMask Mobile or Trust Wallet, or use Stripe for card payments.'
                    );
                }
            } else {
                if (window.ToastModule) {
                    window.ToastModule.warning(
                        'No Wallet Detected',
                        'Please install MetaMask or enable Brave Wallet to pay with crypto.'
                    );
                }
                window.open('https://metamask.io/', '_blank');
            }
            return false;
        }

        try {
            if (window.ToastModule) {
                window.ToastModule.info('Connecting', 'Opening wallet...');
            }

            // Detect wallet type
            const isBrave = navigator.brave && (await navigator.brave.isBrave());
            const walletName = isBrave ? 'Brave Wallet' : 'MetaMask';

            provider = new ethers.BrowserProvider(window.ethereum);

            // Request accounts first (this triggers the wallet popup)
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
            } catch (accountError) {
                console.error('Account request error:', accountError);

                // Handle Brave Wallet specific errors
                if (accountError.code === -32603 || accountError.message?.includes('UNKNOWN_ERROR')) {
                    if (window.ToastModule) {
                        window.ToastModule.error(
                            'Wallet Error',
                            `${walletName} encountered an error. Please try refreshing the page or check your wallet settings.`
                        );
                    }
                    return false;
                }

                // User rejected
                if (accountError.code === 4001) {
                    if (window.ToastModule) window.ToastModule.warning('Cancelled', 'Connection cancelled by user.');
                    return false;
                }

                throw accountError;
            }

            // Network Check (Mainnet = 0x1)
            const network = await provider.getNetwork();
            if (network.chainId !== 1n) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x1' }],
                    });
                    // Re-initialize provider after switch
                    provider = new ethers.BrowserProvider(window.ethereum);
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        if (window.ToastModule) window.ToastModule.error('Network Error', 'Ethereum Mainnet not found in your wallet.');
                    } else if (switchError.code === 4001) {
                        if (window.ToastModule) window.ToastModule.warning('Cancelled', 'Network switch cancelled. Mainnet is required.');
                    } else {
                        if (window.ToastModule) window.ToastModule.error('Error', 'Failed to switch to Ethereum Mainnet.');
                    }
                    return false;
                }
            }

            signer = await provider.getSigner();
            userAddress = await signer.getAddress();
            isConnected = true;

            // Dispatch custom event for UI updates
            window.dispatchEvent(new CustomEvent('wallet:connected', {
                detail: { address: userAddress, truncated: getTruncatedAddress() }
            }));

            if (window.ToastModule) {
                window.ToastModule.success('Connected', `${walletName} connected to Mainnet.`);
            }

            return true;
        } catch (err) {
            console.error('Wallet connection error:', err);

            // Provide helpful error messages
            if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
                if (window.ToastModule) window.ToastModule.warning('Cancelled', 'Connection cancelled by user.');
            } else if (err.code === -32603) {
                if (window.ToastModule) window.ToastModule.error('Wallet Error', 'Internal wallet error. Please try again or use a different browser.');
            } else {
                if (window.ToastModule) window.ToastModule.error('Connection Failed', err.shortMessage || err.message || 'Could not connect wallet.');
            }
            return false;
        }
    }

    /**
     * Disconnect wallet (UI only, doesn't actually disconnect MetaMask)
     */
    function disconnect() {
        provider = null;
        signer = null;
        userAddress = null;
        isConnected = false;

        window.dispatchEvent(new CustomEvent('wallet:disconnected'));
        if (window.ToastModule) window.ToastModule.info('Disconnected', 'Wallet disconnected.');
    }

    /**
     * Send ETH payment
     * @param {string} to - Recipient address
     * @param {string} amountEth - Amount in ETH as string
     * @returns {Promise<{success: boolean, hash?: string, error?: string}>}
     */
    async function sendPayment(to, amountEth) {
        if (!signer) {
            if (window.ToastModule) window.ToastModule.error('Error', 'Wallet not connected');
            return { success: false, error: 'Wallet not connected' };
        }

        try {
            const tx = await signer.sendTransaction({
                to,
                value: ethers.parseEther(amountEth)
            });

            if (window.ToastModule) window.ToastModule.info('Processing', 'Transaction submitted. Waiting for confirmation...');

            // Wait for confirmation
            const receipt = await tx.wait();

            return {
                success: true,
                hash: tx.hash,
                receipt
            };
        } catch (err) {
            console.error('Payment error:', err);

            let errorMessage = 'Transaction failed';

            if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
                if (window.ToastModule) window.ToastModule.warning('Cancelled', 'Transaction cancelled. No funds were deducted.');
                return { success: false, error: 'Cancelled' };
            } else if (err.code === 'INSUFFICIENT_FUNDS') {
                errorMessage = 'Insufficient ETH balance for this transaction.';
                if (window.ToastModule) window.ToastModule.error('Balance Error', errorMessage);
            } else {
                errorMessage = err.shortMessage || err.message || 'Transaction failed on-chain.';
                if (window.ToastModule) window.ToastModule.error('Transaction Failed', errorMessage);
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Sign a message
     * @param {string} message - Message to sign
     * @returns {Promise<{success: boolean, signature?: string, error?: string}>}
     */
    async function signMessage(message) {
        if (!signer) {
            return { success: false, error: 'Wallet not connected' };
        }

        try {
            const signature = await signer.signMessage(message);
            return { success: true, signature };
        } catch (err) {
            console.error('Signing error:', err);

            if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
                if (window.ToastModule) window.ToastModule.warning('Cancelled', 'Signature request cancelled.');
                return { success: false, error: 'Cancelled' };
            }

            if (window.ToastModule) window.ToastModule.error('Signing Failed', 'Could not sign message.');

            return {
                success: false,
                error: err.message || 'Signing failed'
            };
        }
    }

    // Public API
    return {
        connect,
        disconnect,
        getConnectionStatus,
        getTruncatedAddress,
        sendPayment,
        signMessage,
        get address() { return userAddress; },
        get signer() { return signer; },
        get provider() { return provider; },
        get isConnected() { return isConnected; }
    };
})();

// Expose to global scope
window.WalletModule = WalletModule;

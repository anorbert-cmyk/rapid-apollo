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
     * Connect to MetaMask wallet
     * @returns {Promise<boolean>} - Success status
     */
    async function connect() {
        if (!window.ethereum) {
            alert("Please install MetaMask");
            window.open('https://metamask.io/', '_blank');
            return false;
        }

        try {
            if (window.ToastModule) {
                window.ToastModule.info('Connecting', 'Opening MetaMask...');
            }

            provider = new ethers.BrowserProvider(window.ethereum);

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
                        alert("Ethereum Mainnet not found in your wallet.");
                    } else {
                        if (window.ToastModule) {
                            window.ToastModule.error('Error', 'Please switch to Ethereum Mainnet.');
                        }
                        return false;
                    }
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
                window.ToastModule.success('Connected', 'Mainnet Wallet connected.');
            }

            return true;
        } catch (err) {
            console.error('Wallet connection error:', err);
            if (err.code === 4001) {
                if (window.ToastModule) {
                    window.ToastModule.info('Cancelled', 'User rejected connection.');
                }
            } else {
                alert("Connection failed: " + err.message);
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
    }

    /**
     * Send ETH payment
     * @param {string} to - Recipient address
     * @param {string} amountEth - Amount in ETH as string
     * @returns {Promise<{success: boolean, hash?: string, error?: string}>}
     */
    async function sendPayment(to, amountEth) {
        if (!signer) {
            return { success: false, error: 'Wallet not connected' };
        }

        try {
            const tx = await signer.sendTransaction({
                to,
                value: ethers.parseEther(amountEth)
            });

            // Wait for confirmation
            const receipt = await tx.wait();

            return {
                success: true,
                hash: tx.hash,
                receipt
            };
        } catch (err) {
            console.error('Payment error:', err);
            return {
                success: false,
                error: err.message || 'Transaction failed'
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

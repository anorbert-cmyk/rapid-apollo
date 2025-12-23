// ===========================================
// AETHER LOGIC - Main Application (Refactored v5.0)
// Uses modular architecture - all logic delegated to modules
// ===========================================

console.log("App script running v5.0 (Modular)");

// ===========================================
// CLIENT-SIDE CONSTANTS
// ===========================================
const APP_CONFIG = {
    TOAST_DURATION_MS: 8000,
    MODAL_TRANSITION_MS: 300,
    SIGNATURE_TIMEOUT_MS: 5 * 60 * 1000,
    MIN_PROBLEM_LENGTH: 10,
    MAX_PROBLEM_LENGTH: 10000,
    MAX_RECENT_TX_DISPLAY: 5,
    API_VERSION: 'v1',
    API_BASE: '/api'
};

// ===========================================
// GLOBAL STATE
// ===========================================
let provider, signer, userAddress;
let tierPrices = { standard: 0, medium: 0, full: 0 };
let RECIPIENT_ADDRESS = null;

// ===========================================
// INITIALIZATION
// ===========================================

// Fetch Pricing & Config
async function fetchConfigAndPrices() {
    try {
        const res = await fetch('/api/pricing');
        const data = await res.json();
        tierPrices = data;

        const configRes = await fetch('/api/config');
        const configData = await configRes.json();
        if (configData.receiverAddress) {
            RECIPIENT_ADDRESS = configData.receiverAddress;
        }

        // Update UI
        const ethStd = document.getElementById('eth-standard');
        const ethMed = document.getElementById('eth-medium');
        const ethFull = document.getElementById('eth-full');
        if (ethStd) ethStd.innerText = `~${data.standard} ETH`;
        if (ethMed) ethMed.innerText = `~${data.medium} ETH`;
        if (ethFull) ethFull.innerText = `~${data.full} ETH`;

    } catch (e) {
        console.error("Failed to load configuration", e);
    }
}

// Initial Load
fetchConfigAndPrices();
setInterval(fetchConfigAndPrices, 60000);

// ===========================================
// WALLET EVENT HANDLERS
// ===========================================
window.addEventListener('wallet:connected', (event) => {
    const { address, truncated } = event.detail;

    // Sync globals with module
    provider = window.WalletModule.provider;
    signer = window.WalletModule.signer;
    userAddress = window.WalletModule.address;

    // Check admin status via module
    if (window.AdminModule) {
        window.AdminModule.checkStatus(address);
    }

    // Re-load session history to show Dashboard button if user has previous sessions
    if (window.SessionModule) {
        window.SessionModule.load();
    }

    // Update Navbar Button
    const walletBtn = document.getElementById('btn-connect-wallet');
    const walletSpan = document.getElementById('walletAddress');
    if (walletSpan) walletSpan.innerText = truncated;
    if (walletBtn) {
        walletBtn.classList.remove('bg-white/10', 'hover:bg-white/20', 'border-white/10');
        walletBtn.classList.add('bg-green-500/20', 'hover:bg-green-500/30', 'border-green-500/30', 'text-green-300');
    }
});

window.addEventListener('wallet:disconnected', () => {
    provider = null;
    signer = null;
    userAddress = null;

    const walletBtn = document.getElementById('btn-connect-wallet');
    const walletSpan = document.getElementById('walletAddress');
    if (walletSpan) walletSpan.innerText = 'CONNECT WALLET';
    if (walletBtn) {
        walletBtn.classList.add('bg-white/10', 'hover:bg-white/20', 'border-white/10');
        walletBtn.classList.remove('bg-green-500/20', 'hover:bg-green-500/30', 'border-green-500/30', 'text-green-300');
    }
});

// Bind Connect Button
document.getElementById('btn-connect-wallet')?.addEventListener('click', () => window.WalletModule?.connect());

// ===========================================
// PAYMENT FLOW (Using PaymentModule)
// ===========================================
window.payAndSolve = async (tier) => {
    // 1. Auth Check
    if (!userAddress) {
        window.PaymentModule?.showConnectModal();
        return;
    }

    const problem = document.getElementById('problemInput')?.value;

    // 2. Validate Input
    if (!problem || problem.trim() === "") {
        window.ToastModule?.warning("Input Required", "Please describe your problem first!");
        document.getElementById('problemInput')?.focus();
        document.querySelector('.input-section')?.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    if (!RECIPIENT_ADDRESS) {
        window.ToastModule?.error("Config Error", "System configuration not loaded. Please refresh.");
        return;
    }

    try {
        // Disable buttons
        document.querySelectorAll('.pay-btn').forEach(b => b.disabled = true);

        // Show Loading Modal via module
        window.PaymentModule?.showLoading('Fetching Live Rates');
        window.PaymentModule?.updateLoading('🔄 Getting current ETH/USDT price...');

        // 1. Fetch FRESH price
        const priceRes = await fetch('/api/pricing');
        const freshData = await priceRes.json();

        const configRes = await fetch('/api/config');
        const configData = await configRes.json();
        if (configData.receiverAddress) RECIPIENT_ADDRESS = configData.receiverAddress;

        const ethAmount = freshData[tier];

        if (!ethAmount) {
            window.PaymentModule?.hideLoading();
            window.ToastModule?.error("Price Error", "Failed to get live price. Try again.");
            document.querySelectorAll('.pay-btn').forEach(b => b.disabled = false);
            return;
        }

        // Update card pricing visuals
        tierPrices = freshData;
        const ethStd = document.getElementById('eth-standard');
        const ethMed = document.getElementById('eth-medium');
        const ethFull = document.getElementById('eth-full');
        if (ethStd) ethStd.innerText = `~${freshData.standard} ETH`;
        if (ethMed) ethMed.innerText = `~${freshData.medium} ETH`;
        if (ethFull) ethFull.innerText = `~${freshData.full} ETH`;

        // Calculate rate display
        const tierCostUSD = tier === 'standard' ? 19 : tier === 'medium' ? 49 : 199;
        const rate = (tierCostUSD / parseFloat(ethAmount)).toFixed(2);

        const loadingTitle = document.getElementById('loadingTitle');
        if (loadingTitle) loadingTitle.innerText = 'Sending Payment';
        window.PaymentModule?.updateLoading(`💰 1 ETH = $${rate} USDT | Sending ${ethAmount} ETH...`);

        // 2. Pay
        const tx = await signer.sendTransaction({
            to: RECIPIENT_ADDRESS,
            value: ethers.parseEther(ethAmount.toString())
        });

        if (loadingTitle) loadingTitle.innerText = 'Waiting for Confirmation';
        window.PaymentModule?.updateLoading('⏳ Your transaction is in the queue...', tx.hash);

        await tx.wait(1);

        if (loadingTitle) loadingTitle.innerText = 'Payment Confirmed!';
        window.PaymentModule?.updateLoading('✅ Generating AI response...', tx.hash);

        // 3. Solve
        const response = await fetch('/api/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                problemStatement: problem,
                txHash: tx.hash,
                tier: tier
            })
        });

        const result = await response.json();

        if (response.ok) {
            // 4. Success State
            window.PaymentModule?.showSuccess();

            // Save Session via module
            if (window.SessionModule) {
                window.SessionModule.save({
                    txHash: result.txHash,
                    problem: problem,
                    solution: result.solution,
                    tier: tier,
                    timestamp: Date.now()
                });
            }

            // 5. Setup Dashboard Entry
            const btnEnterDashboard = document.getElementById('btn-enter-dashboard');
            if (btnEnterDashboard) {
                btnEnterDashboard.onclick = () => window.enterDashboard();
            }

        } else {
            window.ToastModule?.error("Error", result.error);
        }

    } catch (error) {
        console.error('Payment/Solve Error:', error);

        // Reset Modal via module
        window.PaymentModule?.reset();

        // Handle error via module
        window.PaymentModule?.handleError(error);

    } finally {
        document.querySelectorAll('.pay-btn').forEach(b => b.disabled = false);
    }
};

// ===========================================
// GLOBAL FUNCTION DELEGATIONS TO MODULES
// ===========================================

// Session Module Delegations
window.syncHistory = async () => {
    if (window.SessionModule) {
        await window.SessionModule.syncFromCloud(signer, userAddress);
    }
};

// Dashboard Module Delegations
window.enterDashboard = () => {
    if (window.DashboardModule && window.SessionModule) {
        const isAdmin = window.AdminModule?.getIsAdmin() || false;
        const currentSession = window.SessionModule.getCurrent();
        const newSession = window.DashboardModule.enter(currentSession, isAdmin);
        if (newSession && !currentSession) {
            window.SessionModule.setCurrent(newSession);
        }
    }
};

window.switchView = (viewName) => {
    if (window.DashboardModule) {
        const isAdmin = window.AdminModule?.getIsAdmin() || false;
        window.DashboardModule.switchView(viewName, isAdmin);
    }
};

window.toggleInputView = (showHistory) => {
    if (window.DashboardModule) {
        window.DashboardModule.toggleInputView(showHistory);
    }
};

// Admin Module Delegations
window.refreshAdminStats = async () => {
    if (window.AdminModule) {
        // Use WalletModule directly to ensure signer/address are always current
        const currentSigner = window.WalletModule?.signer || signer;
        const currentAddress = window.WalletModule?.address || userAddress;

        if (!currentSigner || !currentAddress) {
            window.ToastModule?.warning('Connect Wallet', 'Please connect your wallet first.');
            return;
        }

        await window.AdminModule.refreshStats(currentSigner, currentAddress);
    }
};

window.loadTransactionHistory = async () => {
    if (window.AdminModule) {
        const currentSigner = window.WalletModule?.signer || signer;
        const currentAddress = window.WalletModule?.address || userAddress;

        if (!currentSigner || !currentAddress) {
            return;
        }

        await window.AdminModule.loadTransactionHistory(currentSigner, currentAddress);
    }
};

window.filterTransactions = (searchTerm) => {
    if (window.AdminModule) {
        window.AdminModule.filterTransactions(searchTerm);
    }
};

window.exportAdminCSV = () => {
    if (window.AdminModule) {
        window.AdminModule.exportCSV();
    }
};

// Share Module Delegations
window.shareResult = async () => {
    if (window.ShareModule) {
        await window.ShareModule.shareResult(window.currentTxHash, signer, userAddress);
    }
};

// Payment Module Delegations (for backwards compatibility)
window.hideConnectModal = () => {
    if (window.PaymentModule) {
        window.PaymentModule.hideConnectModal();
    }
};

// ===========================================
// BUTTON EVENT BINDINGS
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    // Payment Tier Buttons
    const btnStandard = document.getElementById('btn-pay-standard');
    const btnMedium = document.getElementById('btn-pay-medium');
    const btnFull = document.getElementById('btn-pay-full');

    if (btnStandard) btnStandard.addEventListener('click', () => payAndSolve('standard'));
    if (btnMedium) btnMedium.addEventListener('click', () => payAndSolve('medium'));
    if (btnFull) btnFull.addEventListener('click', () => payAndSolve('full'));

    // Connect Modal Button
    const btnModalConnect = document.getElementById('btn-modal-connect');
    if (btnModalConnect) {
        btnModalConnect.onclick = async () => {
            console.log("Initialize Session clicked");
            const connected = await window.WalletModule?.connect();
            if (connected) {
                window.PaymentModule?.hideConnectModal();
            }
        };
    }
});

// ===========================================
// GLOBAL ERROR BOUNDARY
// ===========================================
window.addEventListener('unhandledrejection', (event) => {
    console.error("Critical Failure:", event.reason);
    if (window.ToastModule) window.ToastModule.error("System Error", "Logic Engine Disrupted. Retrying...");
});

window.addEventListener('error', (event) => {
    console.error("System Error:", event.error);
    if (event.target?.tagName !== 'IMG' && window.ToastModule) {
        window.ToastModule.error("System Error", "Unexpected Anomalies Detected.");
    }
});

// ===========================================
// PAYMENT SUCCESS POPUP
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    // Check for payment success redirect
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');

    if (paymentStatus === 'success') {
        // Show success popup
        showPaymentSuccessModal();

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Clean up localStorage
        localStorage.removeItem('paymentSuccess');
    }
});

function showPaymentSuccessModal() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'payment-success-modal';
    modal.innerHTML = `
        <div class="psm-overlay"></div>
        <div class="psm-content">
            <div class="psm-icon">🎉</div>
            <h2>Fizetés Sikeres!</h2>
            <p>Köszönjük a vásárlást!</p>
            <div class="psm-email-notice">
                <strong>📧 Email értesítés küldve!</strong><br>
                Hamarosan kapsz egy emailt a fizetési visszaigazolásról, benne egy <strong>belépési linkkel</strong> az elemzésedhez.
            </div>
            <p class="psm-check">Ellenőrizd az email fiókodat (és a spam mappát is)!</p>
            <button class="psm-btn" onclick="closePaymentSuccessModal()">Rendben!</button>
        </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        #payment-success-modal { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; animation: psmFadeIn 0.3s ease; }
        @keyframes psmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .psm-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); }
        .psm-content { position: relative; background: linear-gradient(135deg, #1a1a3e 0%, #0f0f23 100%); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 24px; padding: 2.5rem; max-width: 450px; text-align: center; box-shadow: 0 25px 50px rgba(99, 102, 241, 0.3); animation: psmSlideUp 0.4s ease; }
        @keyframes psmSlideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .psm-icon { font-size: 4rem; margin-bottom: 1rem; animation: psmBounce 0.6s ease; }
        @keyframes psmBounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
        .psm-content h2 { font-size: 1.75rem; margin-bottom: 0.5rem; background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .psm-content p { color: rgba(255,255,255,0.7); margin-bottom: 1rem; }
        .psm-email-notice { background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 1rem; margin: 1.5rem 0; text-align: left; }
        .psm-email-notice strong { color: #818cf8; }
        .psm-check { font-size: 0.9rem; color: rgba(255,255,255,0.5); }
        .psm-btn { margin-top: 1.5rem; padding: 1rem 2.5rem; background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .psm-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4); }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);
}

function closePaymentSuccessModal() {
    const modal = document.getElementById('payment-success-modal');
    if (modal) {
        modal.style.animation = 'psmFadeIn 0.2s ease reverse';
        setTimeout(() => modal.remove(), 200);
    }
}

// ===========================================
// END OF REFACTORED APP.JS
// ===========================================
console.log("App v5.0 loaded - All modules delegated");

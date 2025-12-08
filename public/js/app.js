console.log("App script running v2.0");

// ===========================================
// CLIENT-SIDE CONSTANTS
// ===========================================
const APP_CONFIG = {
    // UI Timing
    TOAST_DURATION_MS: 8000,
    MODAL_TRANSITION_MS: 300,
    SIGNATURE_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes

    // Limits
    MIN_PROBLEM_LENGTH: 10,
    MAX_PROBLEM_LENGTH: 10000,
    MAX_RECENT_TX_DISPLAY: 5,

    // API Version
    API_VERSION: 'v1',
    API_BASE: '/api' // Can be changed to '/api/v1' when ready
};

let provider, signer, userAddress;
let tierPrices = { standard: 0, medium: 0, full: 0 };
let RECIPIENT_ADDRESS = null; // Will be fetched from backend

// Elements
const connectBtn = document.getElementById('connectBtn');
const walletInfo = document.getElementById('walletAddress');
const statusDiv = document.getElementById('status');
const problemInput = document.getElementById('problemInput');

// Fetch Pricing & Config
async function fetchConfigAndPrices() {
    try {
        // Fetch pricing
        const res = await fetch('/api/pricing');
        const data = await res.json();

        // Store Prices
        tierPrices = data;

        // Fetch receiver address separately (security: not exposed in pricing)
        const configRes = await fetch('/api/config');
        const configData = await configRes.json();
        if (configData.receiverAddress) {
            RECIPIENT_ADDRESS = configData.receiverAddress;
        }

        // Update UI
        document.getElementById('eth-standard').innerText = `~${data.standard} ETH`;
        document.getElementById('eth-medium').innerText = `~${data.medium} ETH`;
        document.getElementById('eth-full').innerText = `~${data.full} ETH`;

    } catch (e) {
        console.error("Failed to load configuration", e);
    }
}

// Initial Load
fetchConfigAndPrices();
setInterval(fetchConfigAndPrices, 60000);


// Wallet Connection Logic
async function connectWallet() {
    if (window.ethereum) {
        try {
            showToast('Connecting', 'Opening MetaMask...');
            provider = new ethers.BrowserProvider(window.ethereum);

            // Network Check (Mainnet = 0x1)
            const network = await provider.getNetwork();
            if (network.chainId !== 1n) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x1' }],
                    });
                    // Re-initialize provider after switch just to be safe
                    provider = new ethers.BrowserProvider(window.ethereum);
                } catch (switchError) {
                    // This error code means the chain has not been added to MetaMask (unlikely for Mainnet, but consistent handling)
                    if (switchError.code === 4902) {
                        alert("Ethereum Mainnet not found in your wallet. Please add it manually.");
                    } else {
                        showToast('Error', 'Please switch to Ethereum Mainnet to continue.');
                        return false;
                    }
                }
            }

            signer = await provider.getSigner();
            userAddress = await signer.getAddress();

            checkAdminStatus(userAddress); // Check Admin

            // Update Navbar Button to show connected wallet
            const walletBtn = document.getElementById('btn-connect-wallet');
            const walletSpan = document.getElementById('walletAddress');
            if (walletSpan) {
                walletSpan.innerText = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
            }
            if (walletBtn) {
                walletBtn.classList.remove('bg-white/10', 'hover:bg-white/20', 'border-white/10');
                walletBtn.classList.add('bg-green-500/20', 'hover:bg-green-500/30', 'border-green-500/30', 'text-green-300');
            }

            showToast('Connected', 'Mainnet Wallet connected.');
            return true;
        } catch (err) {
            console.error(err);
            if (err.code === 4001) {
                showToast('Cancelled', 'User rejected connection.');
            } else {
                alert("Connection failed: " + err.message);
            }
            return false;
        }
    } else {
        alert("Please install MetaMask");
        window.open('https://metamask.io/', '_blank');
        return false;
    }
}

document.getElementById('btn-connect-wallet').addEventListener('click', connectWallet);

// Loading Modal Elements (New ID structure)
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingTitle = document.getElementById('loadingTitle');
const loadingStatus = document.getElementById('loadingStatus');
const loadingTxHash = document.getElementById('loadingTxHash');
// loadingRecipient is hidden in new design, but we can keep logic safe
// loadingRecipient is hidden in new design, but we can keep logic safe
const loadingRecipient = { innerText: '' }; // Mock object to prevent errors if referenced, but never displayed

function showLoading(title = 'Processing Payment') {
    loadingTitle.innerText = title;
    loadingStatus.innerText = 'Initiating...';
    loadingTxHash.innerText = '';

    loadingOverlay.classList.remove('hidden');
    loadingOverlay.classList.add('flex');

    // Exclusive Visibility
    if (connectModal) connectModal.classList.add('hidden');
    if (successState) successState.classList.add('hidden');
    const loadState = document.getElementById('loadingState');
    if (loadState) loadState.classList.remove('hidden');
}

function updateLoading(status, txHash = null) {
    loadingStatus.innerText = status;
    if (txHash) {
        loadingTxHash.innerHTML = `<a href="https://etherscan.io/tx/${txHash}" target="_blank" class="text-indigo-400 hover:text-white underline">View TX: ${txHash.slice(0, 10)}...</a>`;
    }
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
    loadingOverlay.classList.remove('flex');
}

// Toast Logic (Tailwind Transitions)
function showToast(title, message) {
    const toast = document.getElementById('toast');
    toast.querySelector('.toast-title').innerText = title;
    toast.querySelector('.toast-message').innerText = message;

    // Animate In: Remove hidden/offset state
    toast.classList.remove('translate-y-20', 'opacity-0');

    setTimeout(() => {
        // Animate Out: Add hidden/offset state
        toast.classList.add('translate-y-20', 'opacity-0');
    }, APP_CONFIG.TOAST_DURATION_MS);
}

// Connect Wallet Modal Logic
const connectModal = document.getElementById('connectWalletModal');
const btnModalConnect = document.getElementById('btn-modal-connect');
const loadingState = document.getElementById('loadingState'); // Add reference
const successState = document.getElementById('successState'); // Add reference

function showConnectModal() {
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.classList.add('flex');

    // Exclusive Visibility
    connectModal.classList.remove('hidden');
    if (loadingState) loadingState.classList.add('hidden');
    if (successState) successState.classList.add('hidden');

    // Wire up button
    btnModalConnect.onclick = async () => {
        console.log("Initialize Session clicked");
        const connected = await connectWallet();
        if (connected) {
            hideConnectModal();
        }
    };
}

window.hideConnectModal = function () {
    connectModal.classList.add('hidden');
    loadingOverlay.classList.add('hidden');
    loadingOverlay.classList.remove('flex');

    // Reset to default state for next 'Loading' call
    if (loadingState) loadingState.classList.remove('hidden');
}

// Direct Pay & Solve Logic (Triggered by Card Buttons)
// Direct Pay & Solve Logic (Triggered by Card Buttons)
// Attach event listeners instead of using inline onclick for better reliability
document.addEventListener('DOMContentLoaded', () => {
    // Standard Tier
    const btnStandard = document.getElementById('btn-pay-standard');
    if (btnStandard) {
        btnStandard.addEventListener('click', () => payAndSolve('standard'));
    }

    // Medium Tier
    const btnMedium = document.getElementById('btn-pay-medium');
    if (btnMedium) {
        btnMedium.addEventListener('click', () => payAndSolve('medium'));
    }

    // Full Tier
    const btnFull = document.getElementById('btn-pay-full');
    if (btnFull) {
        btnFull.addEventListener('click', () => payAndSolve('full'));
    }
});

window.payAndSolve = async (tier) => {
    // 1. Auto-Connect / Auth Check
    if (!userAddress) {
        showConnectModal();
        return;
    }

    const problem = document.getElementById('problemInput').value;

    // 2. Then Validate Input
    if (!problem || problem.trim() === "") {
        alert("Please describe your problem first!");
        document.getElementById('problemInput').focus();
        document.querySelector('.input-section').scrollIntoView({ behavior: 'smooth' });
        return;
    }

    if (!RECIPIENT_ADDRESS) {
        alert("System configuration not loaded. Please refresh.");
        return;
    }

    try {
        // Disable buttons
        document.querySelectorAll('.pay-btn').forEach(b => b.disabled = true);

        // Show Loading Modal
        showLoading('Fetching Live Rates');
        updateLoading('🔄 Getting current ETH/USDT price...');

        // 1. Fetch FRESH price
        const priceRes = await fetch('/api/pricing');
        const freshData = await priceRes.json();

        // Fetch latest receiver address from secure endpoint
        const configRes = await fetch('/api/config');
        const configData = await configRes.json();
        if (configData.receiverAddress) RECIPIENT_ADDRESS = configData.receiverAddress;

        const ethAmount = freshData[tier];

        if (!ethAmount) {
            hideLoading();
            alert("Failed to get live price. Try again.");
            document.querySelectorAll('.pay-btn').forEach(b => b.disabled = false);
            return;
        }

        // Update card pricing visuals (optional, but good for sync)
        tierPrices = freshData;
        document.getElementById('eth-standard').innerText = `~${freshData.standard} ETH`;
        document.getElementById('eth-medium').innerText = `~${freshData.medium} ETH`;
        document.getElementById('eth-full').innerText = `~${freshData.full} ETH`;

        // CORRECTED PRICING MAPPING
        const tierCostUSD = tier === 'standard' ? 19 : tier === 'medium' ? 49 : 199;
        const rate = (tierCostUSD / parseFloat(ethAmount)).toFixed(2);

        loadingTitle.innerText = 'Sending Payment';
        updateLoading(`💰 1 ETH = $${rate} USDT | Sending ${ethAmount} ETH...`);

        // 2. Pay
        const tx = await signer.sendTransaction({
            to: RECIPIENT_ADDRESS,
            value: ethers.parseEther(ethAmount.toString())
        });

        loadingTitle.innerText = 'Waiting for Confirmation';
        updateLoading('⏳ Your transaction is in the queue...', tx.hash);

        await tx.wait(1);

        loadingTitle.innerText = 'Payment Confirmed!';
        updateLoading('✅ Generating AI response...', tx.hash);

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

        const result = await response.json(); // Renamed data to result for clarity

        if (response.ok) {
            // 4. Success State & SPA Transition
            const loadingOverlay = document.getElementById('loadingOverlay');
            const loadingState = document.getElementById('loadingState');
            const successState = document.getElementById('successState');
            const btnEnterDashboard = document.getElementById('btn-enter-dashboard');

            loadingState.classList.add('hidden');
            successState.classList.remove('hidden');
            // Keep overlay visible for the success message

            // Save Session Data
            saveSession({
                txHash: result.txHash,
                problem: problem, // Capture from input
                solution: result.solution,
                tier: tier,
                timestamp: Date.now()
            });

            // 5. Setup Dashboard Entry
            btnEnterDashboard.onclick = () => window.enterDashboard();

        } else {
            alert("Error: " + result.error);
        }

    } catch (error) {
        console.error('Payment/Solve Error:', error);

        // Reset Modal
        document.getElementById('loadingOverlay').classList.add('hidden');
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('successState').classList.add('hidden');

        // ===== GRANULAR ERROR HANDLING =====

        // User rejected transaction in MetaMask
        if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
            showToast('Cancelled', 'Transaction rejected by user.');
            return;
        }

        // User rejected network switch
        if (error.code === 4902) {
            showToast('Network Error', 'Please add Ethereum Mainnet to your wallet.');
            return;
        }

        // Insufficient funds
        if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
            showToast('Insufficient Funds', 'Not enough ETH in your wallet for this transaction.');
            return;
        }

        // Gas estimation failed (usually means TX would revert)
        if (error.code === 'UNPREDICTABLE_GAS_LIMIT' || error.message?.includes('gas')) {
            showToast('Gas Error', 'Unable to estimate gas. Your wallet may not have enough ETH.');
            return;
        }

        // Transaction replaced (user sped up or cancelled in wallet)
        if (error.code === 'TRANSACTION_REPLACED') {
            if (error.replacement) {
                showToast('TX Replaced', 'Transaction was replaced. Check your wallet for status.');
            } else {
                showToast('TX Cancelled', 'Transaction was cancelled in wallet.');
            }
            return;
        }

        // Network/RPC error
        if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
            showToast('Network Error', 'Connection issue. Please check your internet and try again.');
            return;
        }

        // Server API returned an error (double-spend, invalid TX, etc.)
        if (error.message?.includes('already processed') || error.message?.includes('insufficient amount')) {
            showToast('Validation Failed', error.message);
            return;
        }

        // Timeout or fetch failure
        if (error.name === 'TypeError' && error.message?.includes('fetch')) {
            showToast('Connection Lost', 'Unable to reach server. Please try again.');
            return;
        }

        // Fallback for unknown errors
        showToast('Error', error.shortMessage || error.message || 'Transaction failed. Please try again.');
    } finally {
        document.querySelectorAll('.pay-btn').forEach(b => b.disabled = false);
    }
};

// Session Management
let currentSession = null;
let sessionHistory = [];

function saveSession(data) {
    // Load existing history
    const stored = localStorage.getItem('masterprompt_history');
    sessionHistory = stored ? JSON.parse(stored) : [];

    // Add new session if it doesn't exist (dedup by txHash)
    if (!sessionHistory.find(h => h.txHash === data.txHash)) {
        sessionHistory.unshift(data); // Add to top
    }

    // Persist
    localStorage.setItem('masterprompt_history', JSON.stringify(sessionHistory));

    // Set current and update UI
    currentSession = data;
    renderHistoryUI();

    // Show Dashboard Button in Navbar
    const navDashboardBtn = document.getElementById('nav-dashboard-btn');
    if (navDashboardBtn) {
        navDashboardBtn.classList.remove('hidden');
        navDashboardBtn.onclick = () => window.enterDashboard();
    }
}

function loadSession() {
    const stored = localStorage.getItem('masterprompt_history');
    if (stored) {
        sessionHistory = JSON.parse(stored);
        if (sessionHistory.length > 0) {
            // Load the most recent session by default
            currentSession = sessionHistory[0];

            // Show Dashboard Button in Navbar
            const navDashboardBtn = document.getElementById('nav-dashboard-btn');
            if (navDashboardBtn) {
                navDashboardBtn.classList.remove('hidden');
                navDashboardBtn.onclick = () => window.enterDashboard();
            }

            renderHistoryUI();
        }
    }
}

function switchSession(txHash) {
    const session = sessionHistory.find(s => s.txHash === txHash);
    if (session) {
        currentSession = session;
        window.enterDashboard(); // Re-render dashboard with new session
    }
}

function renderHistoryUI() {
    const historyContainer = document.getElementById('history-list');
    if (!historyContainer) return;

    historyContainer.innerHTML = ''; // Clear list

    sessionHistory.forEach(s => {
        const item = document.createElement('div');
        const isSelected = currentSession && currentSession.txHash === s.txHash;

        item.className = `p-3 rounded border cursor-pointer mb-2 transition flex justify-between items-center ${isSelected
            ? 'bg-indigo-500/20 border-indigo-500 text-white'
            : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`;

        // Format Date
        const date = new Date(s.timestamp).toLocaleDateString();
        // Tier Badge Color
        const badgeColor = s.tier === 'full' ? 'text-purple-400' : (s.tier === 'medium' ? 'text-indigo-400' : 'text-gray-400');

        item.innerHTML = `
            <div class="truncate mr-2">
                <div class="text-xs font-bold font-mono ${badgeColor} uppercase mb-0.5">${s.tier} ACCESS</div>
                <div class="text-[10px] truncate">"${s.problem.substring(0, 25)}..."</div>
            </div>
            <div class="text-[9px] font-mono opacity-50 whitespace-nowrap">${date}</div>
        `;

        item.onclick = () => switchSession(s.txHash);
        historyContainer.appendChild(item);
    });
}

// Initialize Session on Load
document.addEventListener('DOMContentLoaded', loadSession);

window.enterDashboard = () => {
    // If no real session exists, create a DEMO session for admin preview
    if (!currentSession) {
        if (isAdmin) {
            // Create mock/demo session for admin preview
            currentSession = {
                txHash: 'DEMO-ADMIN-PREVIEW-' + Date.now(),
                problem: '🎯 DEMO: This is an example problem statement that a paying customer would submit. In production, this would contain the user\'s actual question or challenge.',
                solution: `# 🧪 Admin Preview Mode

This is a **demonstration** of what paying customers see after completing their purchase.

## What the Customer Gets

1. **Problem Summary** - Their submitted question appears at the top
2. **AI Solution** - A comprehensive, tier-appropriate response
3. **Transaction Receipt** - Etherscan link to their payment
4. **Session History** - All their past purchases accessible

## Tier Differences

| Tier | Response Depth |
|------|----------------|
| Standard | Concise, direct answer |
| Medium | Detailed with examples |
| **Full** | PhD-level deep dive |

---

> 💡 **Admin Note:** This is demo content. Real solutions are generated by Gemini AI based on the customer's problem and selected tier.

\`\`\`javascript
// Example code block - customers can copy with one click
const demo = "Code blocks have copy buttons!";
\`\`\`
`,
                tier: 'full',
                timestamp: Date.now()
            };
            showToast('Admin Preview', 'Viewing dashboard as customer would see it.');
        } else {
            alert("No active session found. Please complete a payment first.");
            return;
        }
    }

    const landingPage = document.getElementById('landing-page');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const dashboard = document.getElementById('app-dashboard');

    // Transition
    landingPage.style.opacity = '0';
    setTimeout(() => {
        landingPage.style.display = 'none';
        if (loadingOverlay) loadingOverlay.classList.add('hidden');

        dashboard.classList.remove('hidden');

        // Populate Data
        const probDisplay = document.getElementById('problem-display');
        if (probDisplay) probDisplay.innerText = currentSession.problem;

        const txDisplay = document.getElementById('tx-display');
        if (txDisplay) txDisplay.innerText = `TX: ${currentSession.txHash.substring(0, 10)}...`;

        // Render Result
        const resultContent = document.getElementById('result-content');
        renderMarkdownWithUX(currentSession.solution, 'result-content');

        // Store for share context
        window.currentTxHash = currentSession.txHash;

        // Initialize Chart if needed (safe to call multiple times or check instance)
        if (window.initChart && !window.chartInstance) {
            window.initChart();
            // Re-render history to update selection highlight
            renderHistoryUI();

            // Animate Terminal (Visual Flair)
            const termLog = document.getElementById('terminal-log');
            if (termLog) {
                termLog.innerHTML = `
            <div class="text-green-400">> Session Restored.</div>
            <div class="text-indigo-300">> Aether Logic v1.0 Active...</div>
            <div class="text-white">> Strategy Loaded.</div>
            `;
            }
        }

    }, 500);
};

// Secure Cloud Sync
window.syncHistory = async () => {
    if (!signer || !userAddress) {
        alert("Please connect your wallet first.");
        return;
    }

    try {
        const btn = document.getElementById('btn-sync');
        if (btn) {
            btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Syncing...';
            btn.disabled = true;
        }

        // 1. Prepare Auth Payload
        const timestamp = Date.now();
        const message = `Authenticate to Rapid Apollo History: ${timestamp}`;

        // 2. Request Signature
        const signature = await signer.signMessage(message);

        // 3. Send to API
        const response = await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: userAddress,
                signature,
                timestamp
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Sync failed');
        }

        const { history } = await response.json();

        // 4. Merge Logic
        let addedCount = 0;
        // Load existing
        const stored = localStorage.getItem('masterprompt_history');
        let localHistory = stored ? JSON.parse(stored) : [];

        history.forEach(remItem => {
            if (!localHistory.find(loc => loc.txHash === remItem.txHash)) {
                localHistory.push(remItem);
                addedCount++;
            }
        });

        // Save merged
        localHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort DESC
        localStorage.setItem('masterprompt_history', JSON.stringify(localHistory));
        sessionHistory = localHistory;

        renderHistoryUI();

        if (addedCount > 0) {
            showToast('Sync Complete', `Restored ${addedCount} sessions from cloud.`);
            // Auto switch to latest if we had nothing
            if (!currentSession && sessionHistory.length > 0) {
                currentSession = sessionHistory[0];
                window.enterDashboard();
            }
        } else {
            showToast('Sync Complete', 'History is up to date.');
        }

    } catch (error) {
        console.error("Sync Error:", error);
        alert("Sync Failed: " + error.message);
    } finally {
        const btn = document.getElementById('btn-sync');
        if (btn) {
            btn.innerHTML = '<i class="ph-bold ph-cloud-arrow-down"></i> Sync History';
            btn.disabled = false;
        }
    }
};

// Secure Cloud Sync
// ... (keep syncHistory existing code)

// Admin Configuration
let isAdmin = false;

// CHECKS
async function checkAdminStatus(address) {
    if (!address) return;

    try {
        const res = await fetch('/api/admin/check-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
        });
        const data = await res.json();

        if (data.isAdmin) {
            isAdmin = true;
            showToast('Admin Mode', 'Platform Analytics Unlocked');

            // Show Admin Button in Navbar
            const navAdminBtn = document.getElementById('nav-admin-btn');
            if (navAdminBtn) {
                navAdminBtn.classList.remove('hidden');
                navAdminBtn.onclick = async () => {
                    const landingPage = document.getElementById('landing-page');
                    const loadingOverlay = document.getElementById('loadingOverlay');
                    const dashboard = document.getElementById('app-dashboard');

                    if (landingPage && dashboard && dashboard.classList.contains('hidden')) {
                        // Still on landing page, need to transition
                        landingPage.style.opacity = '0';
                        setTimeout(() => {
                            landingPage.style.display = 'none';
                            if (loadingOverlay) loadingOverlay.classList.add('hidden');
                            dashboard.classList.remove('hidden');
                            window.switchView('analytics');
                        }, 300);
                    } else {
                        // Already on dashboard, just switch view
                        window.switchView('analytics');
                    }
                };
            }

            // Show Dashboard Button for Admin Preview
            const navDashboardBtn = document.getElementById('nav-dashboard-btn');
            if (navDashboardBtn) {
                navDashboardBtn.classList.remove('hidden');
                navDashboardBtn.onclick = () => window.enterDashboard();
            }

            // Legacy: Unlock Analytics Tab in Dashboard UI if present
            const navAnalytics = document.getElementById('nav-analytics');
            if (navAnalytics) {
                navAnalytics.innerHTML = `
                     <i class="ph-fill ph-chart-pie-slice text-lg"></i>
                     <span class="text-xs font-bold tracking-widest uppercase">Admin Stats</span>
                 `;
                navAnalytics.onclick = () => window.refreshAdminStats();
                navAnalytics.classList.remove('opacity-50', 'cursor-not-allowed');
                navAnalytics.classList.add('text-indigo-400');
            }
        }
    } catch (e) {
        console.error("Auth Check Failed", e);
    }
}
const originalConnect = window.connectWallet; // If reusing, but easier to just append logic if we can edit in place.
// Since we are replacing sections, let's just hook into the existing connectWallet visually via the 'Connected' toast or similar?
// No, better to add the check directly inside connectWallet logic if possible, or trigger it after.
// We will call checkAdminStatus(userAddress) inside the main flow.

// Admin Stats Logic
let adminChart = null;

window.refreshAdminStats = async () => {
    if (!isAdmin || !signer) return;

    try {
        const timestamp = Date.now();
        const message = `Authenticate to Rapid Apollo Admin: ${timestamp}`;
        const signature = await signer.signMessage(message);

        const res = await fetch('/api/admin/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                address: userAddress,
                signature,
                timestamp
            })
        });

        if (!res.ok) throw new Error("Auth Failed");
        const { stats } = await res.json();

        // Update Main KPIs
        const totalSolves = stats.totalSolves || 0;
        const revenueETH = parseFloat(stats.revenueETH) || 0;

        document.getElementById('stat-solves').innerText = totalSolves;
        document.getElementById('stat-revenue').innerText = revenueETH.toFixed(4);

        // Calculate Derived Metrics
        const uniqueUsers = Math.ceil(totalSolves * 0.8); // Estimate: 80% unique
        const avgOrderValue = totalSolves > 0 ? (revenueETH / totalSolves) : 0;

        const statUsers = document.getElementById('stat-users');
        if (statUsers) statUsers.innerText = uniqueUsers;

        const statAov = document.getElementById('stat-aov');
        if (statAov) statAov.innerText = avgOrderValue.toFixed(4);

        // Determine Top Tier
        const tries = stats.tierDistribution;
        let top = 'N/A';
        let max = -1;
        for (const [k, v] of Object.entries(tries)) {
            if (v > max) { max = v; top = k; }
        }
        document.getElementById('stat-top-tier').innerText = top.toUpperCase();

        // Render Chart
        renderAdminChart(tries);

        // Populate Recent Transactions (Sample UI)
        const recentTxDiv = document.getElementById('recent-transactions');
        if (recentTxDiv) {
            if (totalSolves === 0) {
                recentTxDiv.innerHTML = '<div class="text-xs text-gray-500 italic">No transactions yet.</div>';
            } else {
                // Show last 5 sample entries (in production, this would come from API)
                const tiers = ['standard', 'medium', 'full'];
                const prices = { standard: '0.0050', medium: '0.0130', full: '0.0520' };
                let html = '';
                for (let i = 0; i < Math.min(5, totalSolves); i++) {
                    const tier = tiers[Math.floor(Math.random() * 3)];
                    const time = new Date(Date.now() - (i * 3600000 * Math.random() * 24)).toLocaleString();
                    html += `
                        <div class="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                            <div class="flex items-center gap-3">
                                <span class="w-2 h-2 rounded-full ${tier === 'full' ? 'bg-purple-400' : tier === 'medium' ? 'bg-indigo-400' : 'bg-gray-400'}"></span>
                                <span class="text-white font-mono">${tier.toUpperCase()}</span>
                            </div>
                            <div class="text-right">
                                <div class="text-green-400">${prices[tier]} ETH</div>
                                <div class="text-gray-500 text-[10px]">${time}</div>
                            </div>
                        </div>
                    `;
                }
                recentTxDiv.innerHTML = html;
            }
        }

        showToast('Stats Updated', 'Analytics refreshed successfully.');

        // Render Dynamic Funnel (from API response)
        if (stats.funnel) {
            renderFunnel(stats.funnel);
        }

        // Also load transaction history
        window.loadTransactionHistory();

    } catch (e) {
        console.error("Admin Stats Error:", e);
        showToast("Error", "Failed to fetch admin stats");
    }
};

// Transaction History Table
let allTransactions = [];

window.loadTransactionHistory = async () => {
    if (!isAdmin || !signer) return;

    try {
        const timestamp = Date.now();
        const message = `Authenticate to Rapid Apollo Admin: ${timestamp}`;
        const signature = await signer.signMessage(message);

        const res = await fetch('/api/admin/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                address: userAddress,
                signature,
                timestamp
            })
        });

        if (!res.ok) throw new Error("Auth Failed");
        const { transactions, total } = await res.json();

        allTransactions = transactions;
        renderTransactionTable(transactions);

        document.getElementById('tx-history-stats').innerText = `Showing ${transactions.length} of ${total} transactions`;

    } catch (e) {
        console.error("Load TX History Error:", e);
    }
};

window.filterTransactions = (searchTerm) => {
    if (!searchTerm) {
        renderTransactionTable(allTransactions);
        document.getElementById('tx-history-stats').innerText = `Showing ${allTransactions.length} transactions`;
        return;
    }

    const filtered = allTransactions.filter(tx =>
        tx.wallet.toLowerCase().includes(searchTerm.toLowerCase())
    );
    renderTransactionTable(filtered);
    document.getElementById('tx-history-stats').innerText = `Showing ${filtered.length} of ${allTransactions.length} (filtered by: ${searchTerm.substring(0, 10)}...)`;
};

function renderTransactionTable(transactions) {
    const tbody = document.getElementById('tx-history-body');
    if (!tbody) return;

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-gray-500 italic">No transactions found.</td></tr>';
        return;
    }

    let html = '';
    transactions.forEach(tx => {
        const tierColor = tx.tier === 'full' ? 'text-purple-400' : tx.tier === 'medium' ? 'text-indigo-400' : 'text-gray-400';
        const date = new Date(tx.timestamp).toLocaleString();
        const shortWallet = tx.wallet.substring(0, 6) + '...' + tx.wallet.substring(tx.wallet.length - 4);
        const shortTx = tx.txHash.substring(0, 8) + '...';

        html += `
            <tr class="border-b border-white/5 hover:bg-white/5">
                <td class="py-2 px-2 font-mono">
                    <a href="https://etherscan.io/address/${tx.wallet}" target="_blank" class="text-blue-400 hover:underline">${shortWallet}</a>
                </td>
                <td class="py-2 px-2 font-mono ${tierColor} uppercase font-bold">${tx.tier}</td>
                <td class="py-2 px-2 text-gray-400">${date}</td>
                <td class="py-2 px-2 font-mono">
                    <a href="https://etherscan.io/tx/${tx.txHash}" target="_blank" class="text-blue-400 hover:underline">${shortTx}</a>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function renderAdminChart(data) {
    const ctx = document.getElementById('chart-tiers');
    if (!ctx) return;

    if (adminChart) adminChart.destroy();

    adminChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Standard', 'Medium', 'Full'],
            datasets: [{
                data: [data.standard, data.medium, data.full],
                backgroundColor: ['#94a3b8', '#818cf8', '#c084fc'], // slate, indigo, purple
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10, family: 'monospace' } } }
            }
        }
    });
}

// Dynamic Funnel Renderer
function renderFunnel(funnel) {
    const stages = [
        { id: 'funnel-landing', value: funnel.landing, color: 'green' },
        { id: 'funnel-connected', value: funnel.connected, color: 'green' },
        { id: 'funnel-payment', value: funnel.paymentStarted, color: 'yellow' },
        { id: 'funnel-paid', value: funnel.paid, color: 'red' }
    ];

    const maxVal = funnel.landing || 100;

    stages.forEach((stage, i) => {
        const pct = Math.round((stage.value / maxVal) * 100);
        const pctEl = document.getElementById(`${stage.id}-pct`);
        const barEl = document.getElementById(`${stage.id}-bar`);

        if (pctEl) pctEl.innerText = `${pct}%`;
        if (barEl) barEl.style.width = `${pct}%`;
    });
}

// Export Admin Data to CSV
window.exportAdminCSV = () => {
    if (allTransactions.length === 0) {
        showToast('Export Failed', 'No transaction data to export.');
        return;
    }

    // Create CSV content
    let csv = 'Wallet,Tier,Date,TX Hash\n';
    allTransactions.forEach(tx => {
        csv += `${tx.wallet},${tx.tier},${tx.timestamp},${tx.txHash}\n`;
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapid-apollo-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Export Complete', `Downloaded ${allTransactions.length} transactions.`);
};
// ------------------------------------------
// SHARING & UX
// ------------------------------------------

window.shareResult = async () => {
    console.log("Share button clicked", { currentTxHash: window.currentTxHash, signer: !!signer });

    // We need the txHash of the CURRENTLY displayed result.
    if (!window.currentTxHash) {
        showToast("Cannot Share", "No active result to share. Please view a result first.");
        return;
    }
    if (!signer) {
        showToast("Cannot Share", "Wallet not connected. Please connect wallet first.");
        return;
    }

    try {
        const timestamp = Date.now();
        const message = `Authorize Share for TX ${window.currentTxHash} at ${timestamp}`;

        // UX: Show "Signing..."
        const btn = document.getElementById('btn-share');
        if (btn) btn.innerText = "Signing...";

        const signature = await signer.signMessage(message);
        if (btn) btn.innerText = "Generating...";

        const res = await fetch('/api/share/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                txHash: window.currentTxHash,
                address: userAddress,
                signature,
                timestamp
            })
        });

        if (!res.ok) throw new Error("Share creation failed");
        const { link } = await res.json();

        // Show Link
        const shareUrl = `${window.location.origin}/view.html?id=${link}`;
        prompt("Copy your secure share link:", shareUrl); // Simple prompt for now

    } catch (e) {
        console.error(e);
        alert("Failed to share result.");
    } finally {
        const btn = document.getElementById('btn-share');
        if (btn) btn.innerHTML = '<i class="ph-bold ph-share-network"></i> Share';
    }
};

// Enhance Markdown Rendering with Copy Buttons
function renderMarkdownWithUX(content, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Safety check for marked
    if (window.marked) {
        let html = marked.parse(content);
        if (window.DOMPurify) html = DOMPurify.sanitize(html);
        container.innerHTML = html;
    } else {
        container.innerText = content;
    }

    // Add Copy Buttons
    container.querySelectorAll('pre code').forEach((block) => {
        const pre = block.parentElement;
        // Check if button already exists
        if (pre.querySelector('.copy-btn')) return;

        pre.style.position = 'relative'; // Ensure positioning context

        const btn = document.createElement('button');
        btn.className = 'absolute top-2 right-2 px-2 py-1 bg-white/10 text-gray-400 text-[10px] rounded hover:bg-white/20 transition cursor-pointer copy-btn';
        btn.innerText = 'Copy';
        btn.onclick = () => {
            navigator.clipboard.writeText(block.innerText);
            btn.innerText = 'Copied!';
            setTimeout(() => btn.innerText = 'Copy', 2000);
        };
        pre.appendChild(btn);
    });
}

// ==========================================
// AETHER LOGIC V1.0 - CORE APP
// ==========================================

// --- GLOBAL ERROR BOUNDARY ---
window.addEventListener('unhandledrejection', (event) => {
    console.error("Critical Failure:", event.reason);
    showToast("Logic Engine Disrupted. Retrying...", "error");
});

window.addEventListener('error', (event) => {
    console.error("System Error:", event.error);
    // Don't show toast for minor asset 404s
    if (event.target.tagName !== 'IMG') {
        showToast("Unexpected Anomalies Detected.", "error");
    }
});

// --- END OF DUPLICATE BLOCK CLEANUP ---


// Dashboard View Switcher
window.switchView = (viewName) => {
    if (viewName === 'analytics' && !isAdmin) {
        alert("Restricted: Admin Access Only.");
        return;
    }

    if (viewName !== 'dashboard' && viewName !== 'analytics') {
        // Simple mock for other views
        alert("This module is locked in your current tier.");
        return;
    }

    // Hide all views
    const views = ['dashboard', 'analytics', 'team', 'settings'];

    // ... existing switch logic ...
    views.forEach(v => {
        const el = document.getElementById(`view-${v}`);
        if (el) el.classList.add('hidden');

        const nav = document.getElementById(`nav-${v}`);
        if (nav) {
            nav.classList.remove('sidebar-item-active');
            nav.classList.add('text-gray-500', 'hover:text-white', 'hover:bg-white/5');
            // Keep admin color distinct if active/inactive? 
            if (v === 'analytics' && isAdmin) nav.classList.remove('text-gray-500');
        }
    });

    // Show selected
    const selectedEl = document.getElementById(`view-${viewName}`);
    if (selectedEl) {
        selectedEl.classList.remove('hidden');
        selectedEl.classList.add('animate-slide-up');

        // Auto-refresh stats if entering admin
        if (viewName === 'analytics' && isAdmin) {
            window.refreshAdminStats();
        }
    }

    // Update Nav State
    const activeNav = document.getElementById(`nav-${viewName}`);
    if (activeNav) {
        activeNav.classList.remove('text-gray-500', 'hover:text-white', 'hover:bg-white/5');
        activeNav.classList.add('sidebar-item-active');
    }
};

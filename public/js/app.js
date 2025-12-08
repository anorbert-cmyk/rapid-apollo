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
    }, 4000);
}

// Connect Wallet Modal Logic
const connectModal = document.getElementById('connectWalletModal');
const btnModalConnect = document.getElementById('btn-modal-connect');

function showConnectModal() {
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.classList.add('flex');
    connectModal.classList.remove('hidden');

    // Wire up button (prevent duplicate listeners if possible, or just overwrite)
    btnModalConnect.onclick = async () => {
        const connected = await connectWallet();
        if (connected) {
            hideConnectModal();
            // Optional: Auto-resume payment? 
            // For now, let user click the package button again to confirm intent.
        }
    };
}

window.hideConnectModal = function () { // Global for onclick
    connectModal.classList.add('hidden');
    loadingOverlay.classList.add('hidden');
    loadingOverlay.classList.remove('flex');
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

        showToast('Error', error.message || 'Transaction failed');
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

    // Show Nav Link
    const navLink = document.getElementById('nav-dashboard-link');
    if (navLink) navLink.classList.remove('hidden');
}

function loadSession() {
    const stored = localStorage.getItem('masterprompt_history');
    if (stored) {
        sessionHistory = JSON.parse(stored);
        if (sessionHistory.length > 0) {
            // Load the most recent session by default
            currentSession = sessionHistory[0];
            const navLink = document.getElementById('nav-dashboard-link');
            if (navLink) navLink.classList.remove('hidden');
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
    if (!currentSession) {
        alert("No active session found. Please complete a payment first.");
        return;
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
    if (!currentSigner || !currentAddress) {
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
        const signature = await currentSigner.signMessage(message);

        // 3. Send to API
        const response = await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: currentAddress,
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

            // Unlock Analytics Tab in UI if present
            const navAnalytics = document.getElementById('nav-analytics');
            if (navAnalytics) {
                navAnalytics.innerHTML = `
                     <i class="ph-fill ph-chart-pie-slice text-lg"></i>
                     <span class="text-xs font-bold tracking-widest uppercase">Admin Stats</span>
                 `;
                navAnalytics.onclick = () => window.refreshAdminStats(); // Fix: call refresh logic/switch view
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
    if (!isAdmin || !currentSigner) return;

    try {
        const timestamp = Date.now();
        const message = `Authenticate to Rapid Apollo Admin: ${timestamp}`;
        const signature = await currentSigner.signMessage(message);

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

        // Update KPIs
        document.getElementById('stat-solves').innerText = stats.totalSolves;
        document.getElementById('stat-revenue').innerText = parseFloat(stats.revenueETH).toFixed(4);

        // Determine Top Tier
        const tries = stats.tierDistribution;
        let top = 'ND';
        let max = -1;
        for (const [k, v] of Object.entries(tries)) {
            if (v > max) { max = v; top = k; }
        }
        document.getElementById('stat-top-tier').innerText = top.toUpperCase();

        // Render Chart
        renderAdminChart(tries);

    } catch (e) {
        console.error("Admin Stats Error:", e);
        showToast("Error", "Failed to fetch admin stats");
    }
};

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
// ------------------------------------------
// SHARING & UX
// ------------------------------------------

window.shareResult = async () => {
    // We need the txHash of the CURRENTLY displayed result.
    if (!window.currentTxHash || !currentSigner) {
        alert("No active result to share or wallet disconnected.");
        return;
    }

    try {
        const timestamp = Date.now();
        const message = `Authorize Share for TX ${window.currentTxHash} at ${timestamp}`;

        // UX: Show "Signing..."
        const btn = document.getElementById('btn-share');
        if (btn) btn.innerText = "Signing...";

        const signature = await currentSigner.signMessage(message);
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

// --- STATE MANAGEMENT ---------------------------------------
// SHARING & UX
// ------------------------------------------

window.shareResult = async () => {
    // We need the txHash of the CURRENTLY displayed result.
    // In our current app, 'resultStore' (UI side) isn't explicitly tracking the txHash of the *displayed* item easily unless we store it.
    // Let's assume the txHash is in the DOM or global state. 
    // Ideally, when we render a result, we save 'currentDisplayedTx' in a variable.

    // For now, let's grab it from the DOM or a global if we set one.
    // Hack: We'll set 'window.currentTxHash' whenever we render a result.

    if (!window.currentTxHash || !currentSigner) {
        alert("No active result to share or wallet disconnected.");
        return;
    }

    try {
        const timestamp = Date.now();
        const message = `Authorize Share for TX ${window.currentTxHash} at ${timestamp}`;

        // UX: Show "Signing..."
        const btn = document.getElementById('btn-share');
        if (btn) btn.innerText = "Signing...";

        const signature = await currentSigner.signMessage(message);
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
        // Simple Prompt for now (or a nice modal if time permits)
        prompt("Copy your secure share link:", shareUrl);

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

    container.innerHTML = marked.parse(content);

    // Safety check for XSS (though marked sanitizes if configured, DOMPurify is better)
    if (window.DOMPurify) {
        container.innerHTML = DOMPurify.sanitize(marked.parse(content));
    }

    // Add Copy Buttons
    container.querySelectorAll('pre code').forEach((block) => {
        const pre = block.parentElement;
        // Check if button already exists
        if (pre.querySelector('.copy-btn')) return;

        pre.style.position = 'relative'; // Ensure positioning context

        const btn = document.createElement('button');
        btn.className = 'absolute top-2 right-2 px-2 py-1 bg-white/10 text-gray-400 text-[10px] rounded hover:bg-white/20 transition cursor-pointer';
        btn.innerText = 'Copy';
        btn.onclick = () => {
            navigator.clipboard.writeText(block.innerText);
            btn.innerText = 'Copied!';
            setTimeout(() => btn.innerText = 'Copy', 2000);
        };
        pre.appendChild(btn);
    });
}


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

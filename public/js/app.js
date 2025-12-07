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
        const res = await fetch('/api/pricing');
        const data = await res.json();

        // Store Prices
        tierPrices = data;

        // Store Config
        if (data.receiverAddress) {
            RECIPIENT_ADDRESS = data.receiverAddress;
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
        loadingTxHash.innerHTML = `<a href="https://sepolia.etherscan.io/tx/${txHash}" target="_blank" class="text-indigo-400 hover:text-white underline">View TX: ${txHash.slice(0, 10)}...</a>`;
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

// Direct Pay & Solve Logic (Triggered by Card Buttons)
// Direct Pay & Solve Logic (Triggered by Card Buttons)
window.payAndSolve = async (tier) => {
    // 1. Auto-Connect FIRST (User Feedback Priority)
    if (!userAddress) {
        const connected = await connectWallet();
        if (!connected) return; // Stop if connection failed or rejected
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

        if (freshData.receiverAddress) RECIPIENT_ADDRESS = freshData.receiverAddress;
        // Privacy: Do not display recipient address in UI
        // loadingRecipient.innerText = RECIPIENT_ADDRESS.slice(0, 18) + '...';

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

            // 5. Setup Dashboard Entry
            btnEnterDashboard.onclick = () => {
                // Hide Landing
                const landingPage = document.getElementById('landing-page');
                landingPage.style.opacity = '0';

                setTimeout(() => {
                    landingPage.style.display = 'none';
                    loadingOverlay.classList.add('hidden'); // Ensure modal is gone

                    // Show Dashboard
                    const dashboard = document.getElementById('app-dashboard');
                    dashboard.classList.remove('hidden');

                    // Populate Dashboard Data
                    document.getElementById('problem-display').innerText = problem; // FIXED VAR NAME
                    document.getElementById('tx-display').innerText = `TX: ${result.txHash.substring(0, 10)}...`;
                    document.getElementById('tx-display').innerText = `TX: ${result.txHash.substring(0, 10)}...`;

                    // Render Markdown Result
                    const resultContent = document.getElementById('result-content');
                    if (window.marked && window.DOMPurify) {
                        const rawHtml = window.marked.parse(result.solution);
                        resultContent.innerHTML = window.DOMPurify.sanitize(rawHtml);
                    } else if (window.marked) {
                        console.warn('DOMPurify not found, using raw marked output (Risk of XSS)');
                        resultContent.innerHTML = window.marked.parse(result.solution);
                    } else {
                        resultContent.innerText = result.solution;
                    }

                    // Animate Terminal Log
                    const termLog = document.getElementById('terminal-log');
                    termLog.innerHTML = `
                    <div class="text-green-400">> Payment Verified.</div>
                    <div class="text-indigo-300">> Logic Engine v8.0 Initialized...</div>
                    <div class="text-gray-400">> Analyzing input vector...</div>
                    <div class="text-white">> Strategy Generated.</div>
                 `;

                    // Trigger UI Animations (Bars)
                    setTimeout(() => {
                        const barAmb = document.getElementById('bar-ambiguity');
                        const barRisk = document.getElementById('bar-risk');
                        if (barAmb) barAmb.style.width = '90%';
                        if (barRisk) barRisk.style.width = '85%';
                    }, 500);

                }, 500);
            };

            // Auto-click if instant transition desired, or wait for user
            // For now, we wait for user to click "Enter Dashboard"

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

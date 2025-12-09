// ===========================================
// SESSION MODULE - Session & History Management
// ===========================================

const SessionModule = (function () {
    'use strict';

    const STORAGE_KEY = 'masterprompt_history';

    let currentSession = null;
    let sessionHistory = [];

    /**
     * Save a session to localStorage and update UI
     */
    function save(data) {
        // Load existing history
        const stored = localStorage.getItem(STORAGE_KEY);
        sessionHistory = stored ? JSON.parse(stored) : [];

        // Add new session if it doesn't exist (dedup by txHash)
        if (!sessionHistory.find(h => h.txHash === data.txHash)) {
            sessionHistory.unshift(data);
        }

        // Persist
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionHistory));

        // Set current and update UI
        currentSession = data;
        renderHistoryUI();

        // Show Dashboard Button in Navbar
        _showDashboardButton();
    }

    /**
     * Load session from localStorage
     */
    function load() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            sessionHistory = JSON.parse(stored);
            if (sessionHistory.length > 0) {
                currentSession = sessionHistory[0];
                _showDashboardButton();
                renderHistoryUI();
            }
        }
    }

    /**
     * Switch to a different session by txHash
     */
    function switchTo(txHash) {
        const session = sessionHistory.find(s => s.txHash === txHash);
        if (session) {
            currentSession = session;
            if (window.enterDashboard) {
                window.enterDashboard();
            }
        }
    }

    /**
     * Render history list UI
     */
    function renderHistoryUI() {
        const historyContainer = document.getElementById('history-list');
        if (!historyContainer) return;

        historyContainer.innerHTML = '';

        sessionHistory.forEach(s => {
            const item = document.createElement('div');
            const isSelected = currentSession && currentSession.txHash === s.txHash;

            item.className = `p-3 rounded border cursor-pointer mb-2 transition flex justify-between items-center ${isSelected
                ? 'bg-indigo-500/20 border-indigo-500 text-white'
                : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`;

            const date = new Date(s.timestamp).toLocaleDateString();
            const badgeColor = s.tier === 'full' ? 'text-purple-400' : (s.tier === 'medium' ? 'text-indigo-400' : 'text-gray-400');

            item.innerHTML = `
                <div class="truncate mr-2">
                    <div class="text-xs font-bold font-mono ${badgeColor} uppercase mb-0.5">${s.tier} ACCESS</div>
                    <div class="text-[10px] truncate">"${s.problem.substring(0, 25)}..."</div>
                </div>
                <div class="text-[9px] font-mono opacity-50 whitespace-nowrap">${date}</div>
            `;

            item.onclick = () => switchTo(s.txHash);
            historyContainer.appendChild(item);
        });
    }

    /**
     * Sync history from cloud
     */
    async function syncFromCloud(signer, userAddress) {
        if (!signer || !userAddress) {
            window.ToastModule?.warning("Wallet Required", "Please connect your wallet first.");
            return;
        }

        const btn = document.getElementById('btn-sync');
        try {
            if (btn) {
                btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Syncing...';
                btn.disabled = true;
            }

            const timestamp = Date.now();
            const message = `Authenticate to Rapid Apollo History: ${timestamp}`;
            const signature = await signer.signMessage(message);

            const response = await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: userAddress, signature, timestamp })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Sync failed');
            }

            const { history } = await response.json();

            // Merge Logic
            let addedCount = 0;
            const stored = localStorage.getItem(STORAGE_KEY);
            let localHistory = stored ? JSON.parse(stored) : [];

            history.forEach(remItem => {
                if (!localHistory.find(loc => loc.txHash === remItem.txHash)) {
                    localHistory.push(remItem);
                    addedCount++;
                }
            });

            // Save merged
            localHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(localHistory));
            sessionHistory = localHistory;

            renderHistoryUI();

            if (addedCount > 0) {
                window.ToastModule?.success('Sync Complete', `Restored ${addedCount} sessions from cloud.`);
                if (!currentSession && sessionHistory.length > 0) {
                    currentSession = sessionHistory[0];
                    window.enterDashboard?.();
                }
            } else {
                window.ToastModule?.info('Sync Complete', 'History is up to date.');
            }

        } catch (error) {
            console.error("Sync Error:", error);
            window.ToastModule?.error("Sync Failed", error.message);
        } finally {
            if (btn) {
                btn.innerHTML = '<i class="ph-bold ph-cloud-arrow-down"></i> Sync History';
                btn.disabled = false;
            }
        }
    }

    // Private helpers
    function _showDashboardButton() {
        const navDashboardBtn = document.getElementById('nav-dashboard-btn');
        if (navDashboardBtn) {
            navDashboardBtn.classList.remove('hidden');
            navDashboardBtn.onclick = () => window.enterDashboard?.();
        }
    }

    // Getters
    function getCurrent() { return currentSession; }
    function setCurrent(session) { currentSession = session; }
    function getHistory() { return sessionHistory; }

    // Public API
    return {
        save,
        load,
        switchTo,
        renderHistoryUI,
        syncFromCloud,
        getCurrent,
        setCurrent,
        getHistory
    };
})();

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => SessionModule.load());

// Expose globally
window.SessionModule = SessionModule;

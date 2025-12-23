// ===========================================
// ADMIN MODULE - Admin Dashboard & Analytics
// ===========================================

const AdminModule = (function () {
    'use strict';

    let isAdmin = false;
    let adminChart = null;
    let allTransactions = [];

    /**
     * Check if connected wallet is admin
     */
    async function checkStatus(address) {
        if (!address) return false;

        try {
            const res = await fetch('/api/admin/check-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address })
            });
            const data = await res.json();

            if (data.isAdmin) {
                isAdmin = true;
                window.ToastModule?.success('Admin Mode', 'Platform Analytics Unlocked');
                _setupAdminUI();
                return true;
            }
            return false;
        } catch (e) {
            console.error("Auth Check Failed", e);
            return false;
        }
    }

    /**
     * Refresh admin statistics
     */
    async function refreshStats(signer, userAddress) {
        if (!isAdmin || !signer) return;

        try {
            const timestamp = Date.now();
            const message = `Authenticate to Rapid Apollo Admin: ${timestamp}`;
            const signature = await signer.signMessage(message);

            const res = await fetch('/api/admin/stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: userAddress, signature, timestamp })
            });

            if (!res.ok) throw new Error("Auth Failed");
            const { stats } = await res.json();

            // Update Main KPIs
            const totalSolves = stats.totalSolves || 0;
            const revenueETH = parseFloat(stats.revenueETH) || 0;

            _updateElement('stat-solves', totalSolves);
            _updateElement('stat-revenue', revenueETH.toFixed(4));

            // Calculate Derived Metrics
            const uniqueUsers = Math.ceil(totalSolves * 0.8);
            const avgOrderValue = totalSolves > 0 ? (revenueETH / totalSolves) : 0;

            _updateElement('stat-users', uniqueUsers);
            _updateElement('stat-aov', avgOrderValue.toFixed(4));

            // Determine Top Tier
            const tries = stats.tierDistribution;
            let top = 'N/A';
            let max = -1;
            for (const [k, v] of Object.entries(tries)) {
                if (v > max) { max = v; top = k; }
            }
            _updateElement('stat-top-tier', top.toUpperCase());

            // Render Chart
            _renderChart(tries);

            // Render Recent Transactions (uses allTransactions after loadTransactionHistory)
            _renderRecentTransactions();

            window.ToastModule?.success('Stats Updated', 'Analytics refreshed successfully.');

            // Render Funnel
            if (stats.funnel) {
                _renderFunnel(stats.funnel);
            }

            // Load transaction history
            await loadTransactionHistory(signer, userAddress);

        } catch (e) {
            console.error("Admin Stats Error:", e);
            window.ToastModule?.error("Error", "Failed to fetch admin stats");
        }
    }

    /**
     * Load transaction history
     */
    async function loadTransactionHistory(signer, userAddress) {
        if (!isAdmin || !signer) return;

        try {
            const timestamp = Date.now();
            const message = `Authenticate to Rapid Apollo Admin: ${timestamp}`;
            const signature = await signer.signMessage(message);

            const res = await fetch('/api/admin/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: userAddress, signature, timestamp })
            });

            if (!res.ok) throw new Error("Auth Failed");
            const { transactions, total } = await res.json();

            allTransactions = transactions;
            _renderTransactionTable(transactions);

            _updateElement('tx-history-stats', `Showing ${transactions.length} of ${total} transactions`);

        } catch (e) {
            console.error("Load TX History Error:", e);
        }
    }

    /**
     * Filter transactions by search term
     */
    function filterTransactions(searchTerm) {
        if (!searchTerm) {
            _renderTransactionTable(allTransactions);
            _updateElement('tx-history-stats', `Showing ${allTransactions.length} transactions`);
            return;
        }

        const filtered = allTransactions.filter(tx =>
            tx.wallet.toLowerCase().includes(searchTerm.toLowerCase())
        );
        _renderTransactionTable(filtered);
        _updateElement('tx-history-stats', `Showing ${filtered.length} of ${allTransactions.length} (filtered by: ${searchTerm.substring(0, 10)}...)`);
    }

    /**
     * Export transactions to CSV
     */
    function exportCSV() {
        if (allTransactions.length === 0) {
            window.ToastModule?.warning('Export Failed', 'No transaction data to export.');
            return;
        }

        let csv = 'Wallet,Tier,Date,TX Hash\n';
        allTransactions.forEach(tx => {
            csv += `${tx.wallet},${tx.tier},${tx.timestamp},${tx.txHash}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapid-apollo-transactions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        window.ToastModule?.success('Export Complete', `Downloaded ${allTransactions.length} transactions.`);
    }

    // Private helpers
    function _setupAdminUI() {
        // Show Admin Button in Navbar
        const navAdminBtn = document.getElementById('nav-admin-btn');
        if (navAdminBtn) {
            navAdminBtn.classList.remove('hidden');
            navAdminBtn.onclick = () => {
                const landingPage = document.getElementById('landing-page');
                const loadingOverlay = document.getElementById('loadingOverlay');
                const dashboard = document.getElementById('app-dashboard');

                if (landingPage && dashboard && dashboard.classList.contains('hidden')) {
                    landingPage.style.opacity = '0';
                    setTimeout(() => {
                        landingPage.style.display = 'none';
                        if (loadingOverlay) loadingOverlay.classList.add('hidden');
                        dashboard.classList.remove('hidden');
                        window.switchView?.('analytics');
                    }, 300);
                } else {
                    window.switchView?.('analytics');
                }
            };
        }

        // Unlock Analytics Tab
        const navAnalytics = document.getElementById('nav-analytics');
        if (navAnalytics) {
            navAnalytics.innerHTML = `
                <i class="ph-fill ph-chart-pie-slice text-lg"></i>
                <span class="text-xs font-bold tracking-widest uppercase">Admin Stats</span>
            `;
            navAnalytics.onclick = () => window.refreshAdminStats?.();
            navAnalytics.classList.remove('opacity-50', 'cursor-not-allowed');
            navAnalytics.classList.add('text-indigo-400');
        }
    }

    function _updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    }

    function _renderChart(data) {
        const ctx = document.getElementById('chart-tiers');
        if (!ctx || !window.Chart) return;

        if (adminChart) adminChart.destroy();

        adminChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Standard', 'Medium', 'Full'],
                datasets: [{
                    data: [data.standard, data.medium, data.full],
                    backgroundColor: ['#94a3b8', '#818cf8', '#c084fc'],
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

    function _renderRecentTransactions() {
        const recentTxDiv = document.getElementById('recent-transactions');
        if (!recentTxDiv) return;

        // Use real transactions from allTransactions array
        if (allTransactions.length === 0) {
            recentTxDiv.innerHTML = '<div class="text-xs text-gray-500 italic">No transactions yet.</div>';
            return;
        }

        const prices = { standard: '0.0050', medium: '0.0130', full: '0.0520' };
        let html = '';

        // Show last 5 real transactions
        const recentTx = allTransactions.slice(0, 5);
        recentTx.forEach(tx => {
            const tier = tx.tier || 'standard';
            const time = new Date(tx.timestamp).toLocaleString();
            const shortWallet = tx.wallet ? tx.wallet.substring(0, 6) + '...' : 'N/A';
            html += `
                <div class="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                    <div class="flex items-center gap-3">
                        <span class="w-2 h-2 rounded-full ${tier === 'full' ? 'bg-purple-400' : tier === 'medium' ? 'bg-indigo-400' : 'bg-gray-400'}"></span>
                        <span class="text-white font-mono">${tier.toUpperCase()}</span>
                        <span class="text-gray-500 font-mono text-[10px]">${shortWallet}</span>
                    </div>
                    <div class="text-right">
                        <div class="text-green-400">${prices[tier] || '0.0000'} ETH</div>
                        <div class="text-gray-500 text-[10px]">${time}</div>
                    </div>
                </div>
            `;
        });
        recentTxDiv.innerHTML = html;
    }

    function _renderTransactionTable(transactions) {
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

    function _renderFunnel(funnel) {
        const stages = [
            { id: 'funnel-landing', value: funnel.landing },
            { id: 'funnel-connected', value: funnel.connected },
            { id: 'funnel-payment', value: funnel.paymentStarted },
            { id: 'funnel-paid', value: funnel.paid }
        ];

        const maxVal = funnel.landing || 100;

        stages.forEach(stage => {
            const pct = Math.round((stage.value / maxVal) * 100);
            const pctEl = document.getElementById(`${stage.id}-pct`);
            const barEl = document.getElementById(`${stage.id}-bar`);

            if (pctEl) pctEl.innerText = `${pct}%`;
            if (barEl) barEl.style.width = `${pct}%`;
        });
    }

    // Getters
    function getIsAdmin() { return isAdmin; }

    // Public API
    return {
        checkStatus,
        refreshStats,
        loadTransactionHistory,
        filterTransactions,
        exportCSV,
        getIsAdmin
    };
})();

// Expose globally
window.AdminModule = AdminModule;

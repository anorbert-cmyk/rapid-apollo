// ===========================================
// DASHBOARD MODULE - Main Dashboard Logic
// ===========================================

const DashboardModule = (function () {
    'use strict';

    /**
     * Enter dashboard view with current session
     */
    function enter(currentSession, isAdmin) {
        // If no real session exists, create a DEMO session for admin preview
        if (!currentSession) {
            if (isAdmin) {
                currentSession = _createDemoSession();
                window.ToastModule?.info('Admin Preview', 'Viewing dashboard as customer would see it.');
            } else {
                window.ToastModule?.warning("No Session", "No active session found. Please complete a payment first.");
                return null;
            }
        }

        const landingPage = document.getElementById('landing-page');
        const loadingOverlay = document.getElementById('loadingOverlay');
        const dashboard = document.getElementById('app-dashboard');

        // Transition
        if (landingPage) landingPage.style.opacity = '0';

        setTimeout(() => {
            if (landingPage) landingPage.style.display = 'none';
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            if (dashboard) dashboard.classList.remove('hidden');

            // Populate Data
            _updateElement('problem-display', currentSession.problem);
            _updateElement('tx-display', `TX: ${currentSession.txHash.substring(0, 10)}...`);

            // Render Result
            _renderMarkdown(currentSession.solution, 'result-content');

            // Store for share context
            window.currentTxHash = currentSession.txHash;

            // Initialize Chart if needed
            if (window.initChart && !window.chartInstance) {
                window.initChart();
            }

            // Re-render history
            if (window.SessionModule) {
                window.SessionModule.renderHistoryUI();
            }

            // Animate Terminal
            _animateTerminal();

        }, 500);

        return currentSession;
    }

    /**
     * Switch between dashboard views
     */
    function switchView(viewName, isAdmin) {
        if (viewName === 'analytics' && !isAdmin) {
            window.ToastModule?.error("Access Denied", "Restricted: Admin Access Only.");
            return;
        }

        if (viewName !== 'dashboard' && viewName !== 'analytics') {
            window.ToastModule?.warning("Locked", "This module is locked in your current tier.");
            return;
        }

        const views = ['dashboard', 'analytics', 'team', 'settings'];

        // Hide all views
        views.forEach(v => {
            const el = document.getElementById(`view-${v}`);
            if (el) el.classList.add('hidden');

            const nav = document.getElementById(`nav-${v}`);
            if (nav) {
                nav.classList.remove('sidebar-item-active');
                nav.classList.add('text-gray-500', 'hover:text-white', 'hover:bg-white/5');
                if (v === 'analytics' && isAdmin) nav.classList.remove('text-gray-500');
            }
        });

        // Show selected
        const selectedEl = document.getElementById(`view-${viewName}`);
        if (selectedEl) {
            selectedEl.classList.remove('hidden');
            selectedEl.classList.add('animate-slide-up');

            if (viewName === 'analytics' && isAdmin && window.refreshAdminStats) {
                window.refreshAdminStats();
            }
        }

        // Update Nav State
        const activeNav = document.getElementById(`nav-${viewName}`);
        if (activeNav) {
            activeNav.classList.remove('text-gray-500', 'hover:text-white', 'hover:bg-white/5');
            activeNav.classList.add('sidebar-item-active');
        }
    }

    /**
     * Toggle input/history view in HUD
     */
    function toggleInputView(showHistory) {
        const inputPanel = document.getElementById('input-view-panel');
        const historyPanel = document.getElementById('history-view-panel');

        if (!inputPanel || !historyPanel) return;

        if (showHistory) {
            historyPanel.classList.remove('hidden');
        } else {
            historyPanel.classList.add('hidden');
        }
    }

    // Private helpers
    function _createDemoSession() {
        return {
            txHash: 'DEMO-ADMIN-PREVIEW-' + Date.now(),
            problem: '🎯 DEMO: This is an example problem statement that a paying customer would submit.',
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

> 💡 **Admin Note:** This is demo content. Real solutions are generated by Gemini AI.

\`\`\`javascript
// Example code block
const demo = "Code blocks have copy buttons!";
\`\`\`
`,
            tier: 'full',
            timestamp: Date.now()
        };
    }

    function _updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    }

    function _renderMarkdown(content, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (window.marked) {
            let html = marked.parse(content);
            if (window.DOMPurify) html = DOMPurify.sanitize(html);
            container.innerHTML = html;
        } else {
            container.innerText = content;
        }

        // Add Copy Buttons to code blocks
        container.querySelectorAll('pre code').forEach((block) => {
            const pre = block.parentElement;
            if (pre.querySelector('.copy-btn')) return;

            pre.style.position = 'relative';

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

    function _animateTerminal() {
        const termLog = document.getElementById('terminal-log');
        if (termLog) {
            termLog.innerHTML = `
                <div class="text-green-400">> Session Restored.</div>
                <div class="text-indigo-300">> Aether Logic v1.0 Active...</div>
                <div class="text-white">> Strategy Loaded.</div>
            `;
        }
    }

    // Public API
    return {
        enter,
        switchView,
        toggleInputView
    };
})();

// Expose globally
window.DashboardModule = DashboardModule;

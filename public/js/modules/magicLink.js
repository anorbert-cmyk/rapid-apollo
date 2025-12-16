// ===========================================
// MAGIC LINK MODULE
// Handles magic link authentication and solution loading
// ===========================================

const MagicLinkModule = (function () {
    'use strict';

    /**
     * Check if user arrived via magic link
     */
    function isMagicLinkEntry() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('magic') === '1' && urlParams.get('solution');
    }

    /**
     * Get solution ID from URL
     */
    function getSolutionId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('solution');
    }

    /**
     * Check session status
     */
    async function checkSession() {
        try {
            const res = await fetch('/auth/session', { credentials: 'include' });
            const data = await res.json();
            return data;
        } catch (error) {
            console.error('Session check failed:', error);
            return { authenticated: false };
        }
    }

    /**
     * Load solution data from API
     */
    async function loadSolution(solutionId) {
        try {
            const res = await fetch(`/auth/solution/${solutionId}`, {
                credentials: 'include'
            });

            if (!res.ok) {
                if (res.status === 401) {
                    console.warn('Session expired');
                    return null;
                }
                throw new Error('Failed to load solution');
            }

            return await res.json();
        } catch (error) {
            console.error('Load solution failed:', error);
            return null;
        }
    }

    /**
     * Display solution in output panel
     */
    function displaySolution(solutionData) {
        if (!solutionData || !solutionData.solution) {
            console.error('No solution data to display');
            return;
        }

        const solution = solutionData.solution;
        const tier = solutionData.tier;
        const sections = solution.sections || {};

        // Store in session for dashboard module
        if (window.SessionModule) {
            window.SessionModule.setCurrent({
                txHash: solutionData.id,
                problem: solutionData.problem,
                solution: solution.solution || solution.rawMarkdown,
                sections: sections,
                tier: tier,
                timestamp: solutionData.createdAt
            });
        }

        // Update global for share functionality
        window.currentTxHash = solutionData.id;

        // Switch to dashboard view
        if (window.DashboardModule) {
            window.DashboardModule.enter(window.SessionModule?.getCurrent(), false);
        }

        // Show welcome message
        if (window.ToastModule) {
            const tierNames = {
                'standard': 'Observer',
                'medium': 'Insider',
                'full': 'Syndicate'
            };
            window.ToastModule.success(
                'Analysis Loaded!',
                `Your ${tierNames[tier] || tier} tier analysis is ready.`
            );
        }

        // Render sections using OutputRenderer if available
        if (window.OutputRenderer && sections) {
            setTimeout(() => {
                window.OutputRenderer.init();
            }, 100);
        }

        // Scroll to output section
        const outputSection = document.getElementById('output');
        if (outputSection) {
            setTimeout(() => {
                outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }

    /**
     * Initialize magic link handling
     */
    async function init() {
        if (!isMagicLinkEntry()) {
            return false;
        }

        console.log('Magic Link entry detected');

        const solutionId = getSolutionId();
        if (!solutionId) {
            console.error('No solution ID in magic link');
            return false;
        }

        // Check session
        const session = await checkSession();
        if (!session.authenticated) {
            if (window.ToastModule) {
                window.ToastModule.error('Session Expired', 'Please use your magic link again.');
            }
            return false;
        }

        // Show loading state
        if (window.PaymentModule) {
            window.PaymentModule.showLoading('Loading Your Analysis');
            window.PaymentModule.updateLoading('📥 Fetching your purchased content...');
        }

        // Load solution
        const solutionData = await loadSolution(solutionId);

        // Hide loading
        if (window.PaymentModule) {
            window.PaymentModule.hideLoading();
        }

        if (!solutionData) {
            if (window.ToastModule) {
                window.ToastModule.error('Load Failed', 'Could not load your analysis. Please try again.');
            }
            return false;
        }

        // Display solution
        displaySolution(solutionData);

        // Clean URL (remove magic params)
        const url = new URL(window.location.href);
        url.searchParams.delete('magic');
        url.searchParams.delete('solution');
        window.history.replaceState({}, document.title, url.pathname + '#output');

        return true;
    }

    /**
     * Get all user solutions (for history view)
     */
    async function loadAllSolutions() {
        try {
            const res = await fetch('/auth/solutions', { credentials: 'include' });
            if (!res.ok) return [];
            const data = await res.json();
            return data.solutions || [];
        } catch (error) {
            console.error('Load solutions failed:', error);
            return [];
        }
    }

    // Public API
    return {
        init,
        isMagicLinkEntry,
        checkSession,
        loadSolution,
        loadAllSolutions,
        displaySolution
    };
})();

// Expose globally
window.MagicLinkModule = MagicLinkModule;

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', function () {
    // Delay slightly to ensure other modules are loaded
    setTimeout(() => {
        MagicLinkModule.init();
    }, 200);
});

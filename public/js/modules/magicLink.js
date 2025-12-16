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
     * Display processing state message
     */
    function displayProcessingState(data) {
        // Hide loading modal
        if (window.PaymentModule) {
            window.PaymentModule.hideLoading();
        }

        // Show processing message
        if (window.ToastModule) {
            window.ToastModule.info(
                '⏳ Processing in Progress',
                'Your analysis is being generated. Please come back within 1 hour.'
            );
        }

        // Create a nice processing state UI
        const outputSection = document.getElementById('output');
        if (outputSection) {
            const tierNames = {
                'standard': 'Observer',
                'medium': 'Insider',
                'full': 'Syndicate'
            };

            const processingHTML = `
                <div class="processing-banner" style="
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(167, 139, 250, 0.05) 100%);
                    border: 1px solid rgba(139, 92, 246, 0.3);
                    border-radius: 16px;
                    padding: 40px;
                    text-align: center;
                    margin: 40px auto;
                    max-width: 600px;
                ">
                    <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
                    <h2 style="color: #fff; font-size: 24px; margin-bottom: 15px;">Your Analysis is Being Generated</h2>
                    <p style="color: #a0aec0; font-size: 16px; margin-bottom: 20px;">
                        Thank you for your purchase! Our AI is working on your <strong style="color: #a78bfa;">${tierNames[data.tier] || data.tier} Tier</strong> analysis.
                    </p>
                    <p style="color: #718096; font-size: 14px; margin-bottom: 25px;">
                        This usually takes 2-5 minutes. Please check back soon or wait for the email confirmation.
                    </p>
                    <div style="
                        background: rgba(0,0,0,0.3);
                        border-radius: 10px;
                        padding: 15px;
                        margin-bottom: 20px;
                        text-align: left;
                    ">
                        <div style="color: #8b5cf6; font-size: 11px; text-transform: uppercase; margin-bottom: 5px;">Your Question</div>
                        <div style="color: #e2e8f0; font-size: 14px;">${data.problem || 'Loading...'}</div>
                    </div>
                    <button onclick="location.reload()" style="
                        background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
                        color: #fff;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 10px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 14px;
                    ">
                        🔄 Refresh Page
                    </button>
                </div>
            `;

            // Find the output content area
            const outputContent = outputSection.querySelector('.container') || outputSection;

            // Insert processing banner at the top
            const existingBanner = document.querySelector('.processing-banner');
            if (existingBanner) {
                existingBanner.remove();
            }
            outputContent.insertAdjacentHTML('afterbegin', processingHTML);

            // Scroll to it
            outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        const res = await fetch(`/auth/solution/${solutionId}`, { credentials: 'include' });
        const solutionData = await res.json();

        // Check for processing status (HTTP 202)
        if (res.status === 202 || solutionData.status === 'processing') {
            displayProcessingState(solutionData);

            // Clean URL
            const url = new URL(window.location.href);
            url.searchParams.delete('magic');
            url.searchParams.delete('solution');
            window.history.replaceState({}, document.title, url.pathname + '#output');

            return true;
        }

        // Hide loading
        if (window.PaymentModule) {
            window.PaymentModule.hideLoading();
        }

        if (!res.ok || !solutionData.solution) {
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

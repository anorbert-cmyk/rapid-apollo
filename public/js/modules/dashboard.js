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

            // Render Result - EXPLICITLY clear loading state first
            const resultContainer = document.getElementById('result-content');
            if (resultContainer) {
                // Clear any existing content (including loading spinner)
                resultContainer.innerHTML = '';

                // Render content based on available data
                if (currentSession.sections) {
                    _renderStructuredSections(currentSession, 'result-content');
                } else if (currentSession.solution) {
                    _renderMarkdown(currentSession.solution, 'result-content');
                } else {
                    // Fallback if no content available
                    resultContainer.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-full text-gray-500 font-mono space-y-4">
                            <i class="ph-bold ph-warning text-4xl text-yellow-500"></i>
                            <span class="text-sm">No solution data available</span>
                        </div>
                    `;
                }
            } else {
                console.error('result-content container not found');
            }

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
            solution: `# 🧪 Admin Preview Mode\n\nThis is a **demonstration** of what paying customers see.`,
            sections: {
                executiveSummary: 'This is a demo executive summary showing how structured sections appear to users.',
                keyInsight: 'The key insight would appear here with actionable information.',
                nextStep: 'The recommended next step for the user to take.',
                problemAnalysis: {
                    coreProblem: 'The core problem identified from the user input.',
                    rootCauses: ['Root cause 1', 'Root cause 2', 'Root cause 3'],
                    impactAreas: ['Business impact', 'Technical impact', 'User experience']
                },
                strategicRecommendations: {
                    immediate: ['Action within 24 hours'],
                    shortTerm: ['Action within 1 week'],
                    longTerm: ['Strategic consideration']
                },
                riskAssessment: {
                    risks: ['Potential risk 1', 'Potential risk 2'],
                    mitigations: ['Mitigation strategy 1', 'Mitigation strategy 2']
                }
            },
            meta: {
                tier: 'full',
                provider: 'gemini',
                originalProblem: 'Demo problem statement',
                generatedAt: Date.now()
            },
            tier: 'full',
            timestamp: Date.now()
        };
    }

    /**
     * Render structured sections based on tier
     * SECURITY: All content is sanitized via DOMPurify
     */
    function _renderStructuredSections(sessionData, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const sections = sessionData.sections;
        const tier = sessionData.tier || sessionData.meta?.tier || 'standard';

        // If no sections, fall back to markdown
        if (!sections || !sections.executiveSummary) {
            _renderMarkdown(sessionData.solution || '', containerId);
            return;
        }

        let html = '';

        // Helper to sanitize
        const sanitize = (text) => {
            if (!text) return '';
            return window.DOMPurify ? DOMPurify.sanitize(text) : text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };

        // === EXECUTIVE SUMMARY (All tiers) ===
        html += `
        <div class="mb-8 p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
            <h2 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <i class="ph-bold ph-lightning text-indigo-400"></i> Executive Summary
            </h2>
            <p class="text-gray-300 leading-relaxed">${sanitize(sections.executiveSummary)}</p>
        </div>`;

        // === KEY INSIGHT (All tiers) ===
        html += `
        <div class="mb-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <h3 class="text-sm font-bold text-yellow-400 mb-2 flex items-center gap-2">
                <i class="ph-bold ph-lightbulb"></i> Key Insight
            </h3>
            <p class="text-gray-300">${sanitize(sections.keyInsight)}</p>
        </div>`;

        // === NEXT STEP (All tiers) ===
        html += `
        <div class="mb-8 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <h3 class="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
                <i class="ph-bold ph-arrow-right"></i> Recommended Next Step
            </h3>
            <p class="text-gray-300">${sanitize(sections.nextStep)}</p>
        </div>`;

        // === MEDIUM & FULL TIER SECTIONS ===
        if ((tier === 'medium' || tier === 'full') && sections.problemAnalysis) {
            html += `
            <div class="mb-8">
                <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <i class="ph-bold ph-magnifying-glass"></i> Problem Analysis
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h4 class="text-xs font-mono text-gray-400 uppercase mb-2">Core Problem</h4>
                        <p class="text-gray-300 text-sm">${sanitize(sections.problemAnalysis.coreProblem)}</p>
                    </div>
                    <div class="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h4 class="text-xs font-mono text-gray-400 uppercase mb-2">Root Causes</h4>
                        <ul class="text-gray-300 text-sm space-y-1">
                            ${(sections.problemAnalysis.rootCauses || []).map(c => `<li class="flex items-start gap-2"><span class="text-red-400">•</span> ${sanitize(c)}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h4 class="text-xs font-mono text-gray-400 uppercase mb-2">Impact Areas</h4>
                        <ul class="text-gray-300 text-sm space-y-1">
                            ${(sections.problemAnalysis.impactAreas || []).map(a => `<li class="flex items-start gap-2"><span class="text-orange-400">•</span> ${sanitize(a)}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>`;

            // Strategic Recommendations
            if (sections.strategicRecommendations) {
                html += `
                <div class="mb-8">
                    <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <i class="ph-bold ph-strategy"></i> Strategic Recommendations
                    </h2>
                    <div class="space-y-3">
                        <div class="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                            <h4 class="text-xs font-mono text-red-400 uppercase mb-2">⚡ Immediate (24h)</h4>
                            <ul class="text-gray-300 text-sm space-y-1">
                                ${(sections.strategicRecommendations.immediate || []).map(r => `<li>→ ${sanitize(r)}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                            <h4 class="text-xs font-mono text-yellow-400 uppercase mb-2">📅 Short-Term (1 week)</h4>
                            <ul class="text-gray-300 text-sm space-y-1">
                                ${(sections.strategicRecommendations.shortTerm || []).map(r => `<li>→ ${sanitize(r)}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <h4 class="text-xs font-mono text-blue-400 uppercase mb-2">🎯 Long-Term</h4>
                            <ul class="text-gray-300 text-sm space-y-1">
                                ${(sections.strategicRecommendations.longTerm || []).map(r => `<li>→ ${sanitize(r)}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>`;
            }

            // Risk Assessment
            if (sections.riskAssessment) {
                html += `
                <div class="mb-8">
                    <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <i class="ph-bold ph-warning"></i> Risk Assessment
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="p-4 bg-red-500/5 rounded-lg border border-red-500/20">
                            <h4 class="text-xs font-mono text-red-400 uppercase mb-2">Identified Risks</h4>
                            <ul class="text-gray-300 text-sm space-y-1">
                                ${(sections.riskAssessment.risks || []).map(r => `<li class="flex items-start gap-2"><span class="text-red-400">⚠</span> ${sanitize(r)}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                            <h4 class="text-xs font-mono text-green-400 uppercase mb-2">Mitigations</h4>
                            <ul class="text-gray-300 text-sm space-y-1">
                                ${(sections.riskAssessment.mitigations || []).map(m => `<li class="flex items-start gap-2"><span class="text-green-400">✓</span> ${sanitize(m)}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>`;
            }
        }

        // === FULL TIER ONLY SECTIONS ===
        if (tier === 'full') {
            // Theoretical Framework
            if (sections.theoreticalFramework) {
                html += `
                <div class="mb-8 p-6 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <h2 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <i class="ph-bold ph-books"></i> Theoretical Framework
                    </h2>
                    <div class="mb-3">
                        <span class="text-xs font-mono text-purple-400">Applicable Frameworks:</span>
                        <span class="text-gray-300 ml-2">${(sections.theoreticalFramework.frameworks || []).map(f => sanitize(f)).join(', ')}</span>
                    </div>
                    <p class="text-gray-300">${sanitize(sections.theoreticalFramework.application)}</p>
                </div>`;
            }

            // Projected Outcomes
            if (sections.projectedOutcomes) {
                html += `
                <div class="mb-8 p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                    <h2 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <i class="ph-bold ph-chart-line-up"></i> Projected Outcomes
                    </h2>
                    <div class="flex items-center gap-4 mb-4">
                        <div class="text-3xl font-bold text-green-400">${sections.projectedOutcomes.confidence || 75}%</div>
                        <div class="text-gray-400 text-sm">Confidence Level</div>
                    </div>
                    <p class="text-gray-300 mb-4">${sanitize(sections.projectedOutcomes.expectedImpact)}</p>
                    ${sections.projectedOutcomes.metrics ? `
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="text-gray-400 text-xs uppercase">
                                    <th class="text-left pb-2">Metric</th>
                                    <th class="text-left pb-2">Current</th>
                                    <th class="text-left pb-2">Target</th>
                                    <th class="text-left pb-2">Timeframe</th>
                                </tr>
                            </thead>
                            <tbody class="text-gray-300">
                                ${(sections.projectedOutcomes.metrics || []).map(m => `
                                <tr class="border-t border-white/5">
                                    <td class="py-2">${sanitize(m.name)}</td>
                                    <td class="py-2">${sanitize(m.currentValue || '-')}</td>
                                    <td class="py-2 text-green-400">${sanitize(m.targetValue)}</td>
                                    <td class="py-2">${sanitize(m.timeframe)}</td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>` : ''}
                </div>`;
            }

            // Implementation Roadmap
            if (sections.implementationRoadmap && sections.implementationRoadmap.length > 0) {
                html += `
                <div class="mb-8">
                    <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <i class="ph-bold ph-path"></i> Implementation Roadmap
                    </h2>
                    <div class="space-y-4">
                        ${sections.implementationRoadmap.map((phase, i) => `
                        <div class="p-4 bg-white/5 rounded-lg border border-white/10 relative">
                            <div class="absolute -left-2 top-4 w-4 h-4 bg-indigo-500 rounded-full border-2 border-[#030014]"></div>
                            <div class="flex justify-between items-start mb-2 ml-4">
                                <h4 class="font-bold text-white">${sanitize(phase.phase)}</h4>
                                <span class="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">${sanitize(phase.duration)}</span>
                            </div>
                            <div class="ml-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span class="text-xs text-gray-400">Key Activities:</span>
                                    <ul class="text-gray-300 mt-1">
                                        ${(phase.keyActivities || []).map(a => `<li>• ${sanitize(a)}</li>`).join('')}
                                    </ul>
                                </div>
                                <div>
                                    <span class="text-xs text-gray-400">Deliverables:</span>
                                    <ul class="text-gray-300 mt-1">
                                        ${(phase.deliverables || []).map(d => `<li>📦 ${sanitize(d)}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>`).join('')}
                    </div>
                </div>`;
            }
        }

        // Tier badge
        const tierColors = {
            standard: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
            medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            full: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
        };

        html = `
        <div class="mb-6 flex items-center justify-between">
            <span class="text-xs font-mono text-gray-500">Analysis generated by ${sanitize(sessionData.meta?.provider || 'AI')}</span>
            <span class="px-3 py-1 rounded-full text-xs font-bold uppercase ${tierColors[tier] || tierColors.standard} border">
                ${tier} tier
            </span>
        </div>` + html;

        container.innerHTML = html;
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

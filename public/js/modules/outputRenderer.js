// ===========================================
// OUTPUT RENDERER MODULE
// Renders all layers dynamically in the output panel
// ===========================================

const OutputRenderer = (function () {
    'use strict';

    let currentLayer = 'one-pager';

    // Color class mapping for Tailwind (dynamic classes don't work)
    const colorMap = {
        'red': 'text-red-400',
        'green': 'text-green-400',
        'blue': 'text-blue-400',
        'indigo': 'text-indigo-400',
        'purple': 'text-purple-400',
        'cyan': 'text-cyan-400',
        'yellow': 'text-yellow-400',
        'orange': 'text-orange-400',
        'pink': 'text-pink-400',
        'gray': 'text-gray-400'
    };

    function init() {
        renderLayerTabs();
        switchLayer('one-pager');
    }

    function renderLayerTabs() {
        const tabContainer = document.getElementById('output-layer-tabs');
        if (!tabContainer) return;

        tabContainer.innerHTML = `
            <button onclick="OutputRenderer.switchLayer('one-pager')" id="layer-tab-one-pager"
                class="layer-tab px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <i class="ph-bold ph-file-text"></i> One Pager
            </button>
            <button onclick="OutputRenderer.switchLayer('build-pack')" id="layer-tab-build-pack"
                class="layer-tab px-4 py-2 text-xs font-bold text-gray-400 hover:text-white rounded-lg transition-all flex items-center gap-2">
                <i class="ph-bold ph-hammer"></i> Build Pack
            </button>
            <button onclick="OutputRenderer.switchLayer('appendix')" id="layer-tab-appendix"
                class="layer-tab px-4 py-2 text-xs font-bold text-gray-400 hover:text-white rounded-lg transition-all flex items-center gap-2">
                <i class="ph-bold ph-files"></i> Appendix
            </button>
        `;
    }

    function switchLayer(layer) {
        currentLayer = layer;

        // Update tab styles
        document.querySelectorAll('.layer-tab').forEach(tab => {
            tab.classList.remove('bg-indigo-500/20', 'text-indigo-400', 'border', 'border-indigo-500/30');
            tab.classList.add('text-gray-400');
        });
        const activeTab = document.getElementById(`layer-tab-${layer}`);
        if (activeTab) {
            activeTab.classList.remove('text-gray-400');
            activeTab.classList.add('bg-indigo-500/20', 'text-indigo-400', 'border', 'border-indigo-500/30');
        }

        // Render content
        const container = document.getElementById('output-layer-content');
        if (!container) return;

        let sections = [];
        if (layer === 'one-pager') {
            const l1 = window.OutputContentModule?.getLayer1();
            const l1p = window.OutputContentModule?.getLayer1Plus();
            if (l1) sections = sections.concat(l1.sections);
            if (l1p) sections = sections.concat(l1p.sections);
        } else if (layer === 'build-pack') {
            const l2 = window.OutputContentLayer2?.getLayer2();
            const l2b = window.OutputContentLayer2B?.getSections7to12();
            if (l2) sections = sections.concat(l2.sections);
            if (l2b) sections = sections.concat(l2b);
        } else if (layer === 'appendix') {
            const l3 = window.OutputContentLayer3?.getLayer3();
            if (l3) sections = sections.concat(l3.sections);
        }

        container.innerHTML = renderSections(sections);

        // Auto-enhance content boxes with info tooltips
        setTimeout(() => enhanceContentBoxes(container), 100);
    }

    // Add info tooltips to content boxes inside sections
    function enhanceContentBoxes(container) {
        // Target all panel headers that could use an explanation
        const boxSelectors = [
            '.bg-purple-500\\/10',
            '.bg-indigo-500\\/10',
            '.bg-red-500\\/10',
            '.bg-green-500\\/10',
            '.bg-cyan-500\\/10',
            '.bg-yellow-500\\/10',
            '.bg-blue-500\\/10',
            '.bg-orange-500\\/10',
            '.bg-pink-500\\/10'
        ];

        const boxes = container.querySelectorAll(boxSelectors.join(', '));

        boxes.forEach(box => {
            // Find the header element in the box
            const header = box.querySelector('.font-bold');
            if (!header || box.querySelector('.box-info-btn')) return;

            // Get tooltip text based on header content
            const headerText = header.textContent.trim();
            const tooltipText = getBoxTooltip(headerText);

            if (tooltipText) {
                // Create info button
                const infoBtn = document.createElement('span');
                infoBtn.className = 'box-info-btn relative group inline-block ml-2 cursor-help';
                infoBtn.innerHTML = `
                    <i class="ph-bold ph-info text-current opacity-50 hover:opacity-100 text-[10px] transition"></i>
                    <span class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-900 border border-white/10 rounded-lg shadow-xl text-[10px] text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                        ${tooltipText}
                    </span>
                `;
                header.appendChild(infoBtn);
            }
        });
    }

    // Content box tooltips mapping
    function getBoxTooltip(headerText) {
        const tooltips = {
            // Strategy
            'Primary JTBD': 'Jobs To Be Done: The core outcome the customer is trying to achieve.',
            'Secondary JTBD': 'Secondary jobs that support the primary goal.',
            'User Anxieties & Trust Blockers': 'Common fears that prevent customers from buying.',
            'Value Exchange Map': 'What the customer gives vs. what they receive.',
            // Assumptions & Scope
            '✓ In Scope': 'Features and deliverables included in this phase.',
            '✗ Out of Scope (Phase 2)': 'Items intentionally excluded from initial release.',
            // Research
            'Discovery': 'Understanding user needs and context.',
            'Evaluative': 'Testing solutions with real users.',
            'IA': 'Information Architecture—how content is organized.',
            'Primary Method': 'The main research technique being used.',
            'Add-ons': 'Supplementary research methods.',
            'Recruiting Criteria': 'Who qualifies for research participation.',
            // UX
            'IA & Navigation Model': 'The main navigation structure.',
            'Gating Rules': 'Conditions that must be met before proceeding.',
            // Validation
            'Inline Errors': 'Errors shown directly next to the field.',
            'Summary at Top': 'A list of all errors shown at the top of the form.',
            'Blur + Submit': 'Validation triggers when leaving field or submitting.',
            // Resilience
            'Integration Token Connection': 'OAuth token linking external services.',
            'Irreversible Campaign Launch': 'Actions that cannot be undone once started.',
            // Quality
            'Visibility of Status': 'Users should always see system state.',
            'Error Prevention': 'Design that prevents mistakes before they happen.',
            'Recognition > Recall': 'Users should recognize options, not memorize them.',
            // Cost
            'Rate Sourcing': 'Where salary/cost data comes from.',
            'MVP Portal Build Cost (6-8 weeks)': 'Estimated hours per role for MVP.',
            // ROI
            'Worst Case': 'Conservative scenario with low conversion.',
            'Expected': 'Most likely scenario based on assumptions.',
            'Best Case': 'Optimistic scenario with high conversion.',
            'Impact Hypothesis': 'Expected business outcomes from the solution.',
            // Decisions
            'Top 3 Risk Decisions': 'Highest-risk choices requiring careful consideration.',
            // Figma
            'Prompt A: High Fidelity Happy Path UI': 'Main screens for ideal user flows.',
            'Prompt B: Critical Error & Recovery UI': 'Error states and recovery screens.',
            'Prompt C: Component Library': 'Reusable UI building blocks.',
            // QA
            'QA Checklist': 'Quality checks before design handoff.',
            'Execution Order': 'Recommended sequence for design work.'
        };
        return tooltips[headerText] || null;
    }

    function renderSections(sections) {
        if (!sections || sections.length === 0) {
            return '<div class="text-center text-gray-400 py-12">No content available</div>';
        }

        return sections.map((section, index) => {
            const iconColor = colorMap[section.color] || 'text-gray-400';
            const isHidden = index >= 2 ? 'hidden' : '';
            const rotateClass = index < 2 ? 'rotate-180' : '';
            const infoDesc = section.description || getDefaultDescription(section.id);

            return `
            <div class="glass-panel collapsible-section ${section.isHighlight ? 'border-2 border-indigo-500/30' : ''}" id="section-${section.id}">
                <div class="section-header cursor-pointer p-5 flex items-center gap-3" onclick="OutputRenderer.toggleSection('${section.id}')">
                    <i class="ph-bold ${section.icon} ${iconColor} text-xl"></i>
                    <h3 class="flex-1 text-sm font-bold text-white">${section.title}</h3>
                    <div class="relative group" onclick="event.stopPropagation()">
                        <i class="ph-bold ph-info text-gray-500 hover:text-indigo-400 text-sm cursor-help transition"></i>
                        <div class="info-tooltip absolute right-0 top-6 w-64 p-3 bg-gray-900 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            <p class="text-xs text-gray-300 leading-relaxed">${infoDesc}</p>
                        </div>
                    </div>
                    <i class="ph-bold ph-caret-down collapse-icon text-gray-400 transition-transform ${rotateClass}"></i>
                </div>
                <div class="section-content px-5 pb-5 ${isHidden}">
                    ${section.content}
                </div>
            </div>
        `;
        }).join('');
    }

    // Default descriptions for sections that don't have one
    function getDefaultDescription(sectionId) {
        const descriptions = {
            // Layer 1 - One Pager
            'exec-problem': 'Summarizes the core problem and our solution goal in plain language.',
            'exec-domain': 'Shows potential domains and the associated risk level.',
            'exec-baseline': 'Industry standards: mental models, typical flows, common failures, and KPIs.',
            'exec-northstar': 'The single most important metric that defines success.',
            'exec-breakers': 'Top 5 critical risks that could prevent success.',
            // Layer 1 Plus - Buyer Summary
            'buyer-package': 'What you get across 3 layers: One Pager, Build Pack, Appendix.',
            'buyer-timeline': 'Step-by-step guide for the first few days.',
            'buyer-data': 'How to interpret reports and data.',
            'buyer-responsibilities': 'What\'s your responsibility vs. ours.',
            // Layer 2 - Build Pack
            'build-assumptions': 'List of assumptions that need validation before the project.',
            'build-strategy': 'Jobs To Be Done, anxieties, value exchange map.',
            'build-research': 'Research plan: interviews, tests, validation methods.',
            'build-ux': 'Complete user journey from package selection to reporting.',
            'build-screens': 'All 8 screen specifications: goals, success criteria, edge cases.',
            'build-validation': 'Validation rules: when and how errors should appear.',
            'build-rationale': 'Why we made these decisions—user, business, and tech perspective.',
            'build-resilience': 'Error handling: what happens when things break, how we recover.',
            'build-quality': 'Design quality checklist: visibility, error prevention, recognition.',
            'build-specs': 'Technical specs: components, event tracking, APIs.',
            'build-tech': 'Architecture: frontend, backend, database, integrations.',
            'build-team': 'Team structure and 4-week phase plan.',
            // Layer 3 - Appendix
            'appendix-cost': 'International salary benchmarks and MVP cost estimation.',
            'appendix-roi': 'Business case: worst/expected/best case scenarios.',
            'appendix-decisions': 'Decision table: user impact, business impact, confidence, validation.',
            'appendix-figma': 'Figma AI prompts: copy-paste ready for design.',
            'appendix-qa': 'QA checklist for Figma output.'
        };
        return descriptions[sectionId] || 'This section contains additional details about the topic.';
    }

    function toggleSection(sectionId) {
        const section = document.getElementById(`section-${sectionId}`);
        if (!section) return;

        const content = section.querySelector('.section-content');
        const icon = section.querySelector('.collapse-icon');

        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            icon.classList.add('rotate-180');
        } else {
            content.classList.add('hidden');
            icon.classList.remove('rotate-180');
        }
    }

    function expandAll() {
        document.querySelectorAll('#output-layer-content .section-content').forEach(c => c.classList.remove('hidden'));
        document.querySelectorAll('#output-layer-content .collapse-icon').forEach(i => i.classList.add('rotate-180'));
    }

    function collapseAll() {
        document.querySelectorAll('#output-layer-content .section-content').forEach(c => c.classList.add('hidden'));
        document.querySelectorAll('#output-layer-content .collapse-icon').forEach(i => i.classList.remove('rotate-180'));
    }

    return {
        init,
        switchLayer,
        toggleSection,
        expandAll,
        collapseAll
    };
})();

window.OutputRenderer = OutputRenderer;

// Global copyToClipboard function for Figma prompts
window.copyToClipboard = function (elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        navigator.clipboard.writeText(el.innerText).then(() => {
            if (window.ToastModule) {
                window.ToastModule.success('Copied to clipboard!');
            }
        }).catch(err => {
            console.error('Copy failed:', err);
        });
    }
};

// Auto-init when DOM ready
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        if (window.OutputRenderer) {
            window.OutputRenderer.init();
        }
    }, 500);
});

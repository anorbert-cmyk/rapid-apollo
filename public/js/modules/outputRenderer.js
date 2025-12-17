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

    // Content box tooltips mapping - Format: Context | Importance | Usage
    function getBoxTooltip(headerText) {
        const tooltips = {
            // Strategy
            'Primary JTBD': '<b>Context:</b> Jobs To Be Done framework from Clayton Christensen.<br><b>Importance:</b> Defines the core outcome customers hire your product for.<br><b>Usage:</b> Use to prioritize features that serve this job.',
            'Secondary JTBD': '<b>Context:</b> Supporting jobs beyond the main goal.<br><b>Importance:</b> Adds retention and expands value.<br><b>Usage:</b> Consider in Phase 2 after primary is solved.',
            'User Anxieties & Trust Blockers': '<b>Context:</b> Fears that prevent purchase decisions.<br><b>Importance:</b> Must address these or lose conversions.<br><b>Usage:</b> Design trust signals and copy to mitigate each.',
            'Value Exchange Map': '<b>Context:</b> What customer gives vs receives.<br><b>Importance:</b> Balance determines perceived value.<br><b>Usage:</b> Price and position based on this balance.',
            // Assumptions & Scope
            '✓ In Scope': '<b>Context:</b> Committed deliverables for this phase.<br><b>Importance:</b> Prevents scope creep and sets expectations.<br><b>Usage:</b> Reference in every planning meeting.',
            '✗ Out of Scope (Phase 2)': '<b>Context:</b> Deferred items with clear reasoning.<br><b>Importance:</b> Protects timeline and focus.<br><b>Usage:</b> Move to backlog, revisit after launch.',
            // Research
            'Discovery': '<b>Context:</b> Early-phase research to understand users.<br><b>Importance:</b> Reduces risk of building wrong thing.<br><b>Usage:</b> Run before any design work begins.',
            'Evaluative': '<b>Context:</b> Testing prototypes with real users.<br><b>Importance:</b> Validates assumptions before dev investment.<br><b>Usage:</b> Run on mockups, not just final builds.',
            'IA': '<b>Context:</b> Information Architecture research.<br><b>Importance:</b> Ensures users find what they need.<br><b>Usage:</b> Card sorting, tree testing methods.',
            'Primary Method': '<b>Context:</b> Main research technique selected.<br><b>Importance:</b> Focus resources for max insight.<br><b>Usage:</b> Execute this first, add extras if budget allows.',
            'Add-ons': '<b>Context:</b> Supplementary research methods.<br><b>Importance:</b> Adds depth if primary leaves gaps.<br><b>Usage:</b> Optional based on timeline.',
            'Recruiting Criteria': '<b>Context:</b> Who qualifies for research.<br><b>Importance:</b> Wrong participants = wrong insights.<br><b>Usage:</b> Screen strictly, no internal employees.',
            // UX
            'IA & Navigation Model': '<b>Context:</b> Main menu and content structure.<br><b>Importance:</b> Determines findability and mental model.<br><b>Usage:</b> Test with card sort before finalizing.',
            'Gating Rules': '<b>Context:</b> Conditions before user can proceed.<br><b>Importance:</b> Protects against irreversible errors.<br><b>Usage:</b> Apply to payments, launches, deletions.',
            // Validation
            'Inline Errors': '<b>Context:</b> Error displayed at the field.<br><b>Importance:</b> Fastest user understanding of issue.<br><b>Usage:</b> Always show inline, never modal-only.',
            'Summary at Top': '<b>Context:</b> Aggregated error list above form.<br><b>Importance:</b> Helps when multiple errors exist.<br><b>Usage:</b> Combine with inline for best UX.',
            'Blur + Submit': '<b>Context:</b> Validation timing strategy.<br><b>Importance:</b> Avoids annoying mid-typing errors.<br><b>Usage:</b> Validate on blur, re-validate on submit.',
            // Resilience
            'Integration Token Connection': '<b>Context:</b> OAuth tokens linking external APIs.<br><b>Importance:</b> Tokens expire—users must understand this.<br><b>Usage:</b> Show clear Reconnect CTA when expired.',
            'Irreversible Campaign Launch': '<b>Context:</b> Actions that start live spend.<br><b>Importance:</b> Mistakes cost real money.<br><b>Usage:</b> Require explicit review + confirm step.',
            // Quality
            'Visibility of Status': '<b>Context:</b> Nielsen heuristic #1.<br><b>Importance:</b> Users need to know what\'s happening.<br><b>Usage:</b> Add loaders, status chips, progress bars.',
            'Error Prevention': '<b>Context:</b> Design that stops mistakes.<br><b>Importance:</b> Better than good error messages.<br><b>Usage:</b> Disable invalid options, use defaults.',
            'Recognition > Recall': '<b>Context:</b> Show options, don\'t ask to remember.<br><b>Importance:</b> Reduces cognitive load significantly.<br><b>Usage:</b> Use dropdowns, autocomplete, recent items.',
            // Cost
            'Rate Sourcing': '<b>Context:</b> Where salary benchmarks come from.<br><b>Importance:</b> Credibility of cost estimates.<br><b>Usage:</b> Cite sources in client proposals.',
            'MVP Portal Build Cost (6-8 weeks)': '<b>Context:</b> Hours breakdown by role.<br><b>Importance:</b> Sets budget expectations.<br><b>Usage:</b> Multiply by local rates for estimate.',
            // ROI
            'Worst Case': '<b>Context:</b> Conservative scenario assumptions.<br><b>Importance:</b> Sets floor for decision-making.<br><b>Usage:</b> Use for risk-averse stakeholders.',
            'Expected': '<b>Context:</b> Most likely outcome scenario.<br><b>Importance:</b> Primary planning target.<br><b>Usage:</b> Base all projections on this.',
            'Best Case': '<b>Context:</b> Optimistic assumptions scenario.<br><b>Importance:</b> Shows upside potential.<br><b>Usage:</b> Use for investor pitches.',
            'Impact Hypothesis': '<b>Context:</b> Expected business outcome statement.<br><b>Importance:</b> Defines success criteria.<br><b>Usage:</b> Measure against this post-launch.',
            // Decisions
            'Top 3 Risk Decisions': '<b>Context:</b> Highest-stakes choices in project.<br><b>Importance:</b> These can sink the project if wrong.<br><b>Usage:</b> Get explicit stakeholder sign-off.',
            // Figma
            'Prompt A: High Fidelity Happy Path UI': '<b>Context:</b> Main flow screens for ideal journey.<br><b>Importance:</b> Core experience users see most.<br><b>Usage:</b> Start here, iterate until solid.',
            'Prompt B: Critical Error & Recovery UI': '<b>Context:</b> Error states and recovery flows.<br><b>Importance:</b> Defines trust during failures.<br><b>Usage:</b> Design after happy path is done.',
            'Prompt C: Component Library': '<b>Context:</b> Reusable UI building blocks.<br><b>Importance:</b> Ensures consistency across screens.<br><b>Usage:</b> Build this first for efficiency.',
            // QA
            'QA Checklist': '<b>Context:</b> Quality gates before handoff.<br><b>Importance:</b> Catches issues before development.<br><b>Usage:</b> Run on every design before dev.',
            'Execution Order': '<b>Context:</b> Recommended work sequence.<br><b>Importance:</b> Optimizes dependencies and rework.<br><b>Usage:</b> Follow this order for best results.'
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

    // Default descriptions for sections - Format: Context | Importance | Usage
    function getDefaultDescription(sectionId) {
        const descriptions = {
            // Layer 1 - One Pager
            'exec-problem': '<b>Context:</b> Core problem and solution goal.<br><b>Importance:</b> Aligns all stakeholders on mission.<br><b>Usage:</b> Share with leadership to confirm direction.',
            'exec-domain': '<b>Context:</b> Industry and risk classification.<br><b>Importance:</b> Determines compliance requirements.<br><b>Usage:</b> Reference for legal and marketing teams.',
            'exec-baseline': '<b>Context:</b> Industry benchmarks and standards.<br><b>Importance:</b> Sets realistic expectations.<br><b>Usage:</b> Compare your metrics to these baselines.',
            'exec-northstar': '<b>Context:</b> Single success metric.<br><b>Importance:</b> Unifies team focus.<br><b>Usage:</b> Track weekly, report monthly.',
            'exec-breakers': '<b>Context:</b> Critical risks to project.<br><b>Importance:</b> Early mitigation saves projects.<br><b>Usage:</b> Address each before launch.',
            // Layer 1 Plus - Buyer Summary
            'buyer-package': '<b>Context:</b> Overview of all deliverables.<br><b>Importance:</b> Sets clear expectations.<br><b>Usage:</b> Share with procurement and stakeholders.',
            'buyer-timeline': '<b>Context:</b> Day-by-day action plan.<br><b>Importance:</b> Ensures smooth onboarding.<br><b>Usage:</b> Follow sequentially, check off each step.',
            'buyer-data': '<b>Context:</b> Guide to reading reports.<br><b>Importance:</b> Enables data-driven decisions.<br><b>Usage:</b> Reference when reviewing any report.',
            'buyer-responsibilities': '<b>Context:</b> RACI matrix simplified.<br><b>Importance:</b> Prevents gaps and overlaps.<br><b>Usage:</b> Review before kickoff meeting.',
            // Layer 2 - Build Pack
            'build-assumptions': '<b>Context:</b> Hypotheses needing validation.<br><b>Importance:</b> Unvalidated = high risk.<br><b>Usage:</b> Test each before committing resources.',
            'build-strategy': '<b>Context:</b> JTBD and value exchange framework.<br><b>Importance:</b> Guides all product decisions.<br><b>Usage:</b> Reference during feature prioritization.',
            'build-research': '<b>Context:</b> Research methodology plan.<br><b>Importance:</b> Reduces building wrong thing.<br><b>Usage:</b> Execute before design phase.',
            'build-ux': '<b>Context:</b> End-to-end user journey.<br><b>Importance:</b> Ensures seamless experience.<br><b>Usage:</b> Walk through with stakeholders.',
            'build-screens': '<b>Context:</b> Per-screen specifications.<br><b>Importance:</b> Reduces dev ambiguity.<br><b>Usage:</b> Hand to designers and developers.',
            'build-validation': '<b>Context:</b> Form validation rules.<br><b>Importance:</b> Prevents bad data entry.<br><b>Usage:</b> Implement exactly as specified.',
            'build-rationale': '<b>Context:</b> Decision reasoning documented.<br><b>Importance:</b> Enables future iteration.<br><b>Usage:</b> Reference when questioning decisions.',
            'build-resilience': '<b>Context:</b> Error recovery playbook.<br><b>Importance:</b> Builds user trust.<br><b>Usage:</b> Implement all listed scenarios.',
            'build-quality': '<b>Context:</b> Nielsen heuristics checklist.<br><b>Importance:</b> Catches UX issues early.<br><b>Usage:</b> Review every screen against this.',
            'build-specs': '<b>Context:</b> Component and API specs.<br><b>Importance:</b> Enables clean implementation.<br><b>Usage:</b> Developers reference during build.',
            'build-tech': '<b>Context:</b> System architecture overview.<br><b>Importance:</b> Guides infrastructure decisions.<br><b>Usage:</b> Share with engineering team.',
            'build-team': '<b>Context:</b> Team structure and phases.<br><b>Importance:</b> Ensures proper resourcing.<br><b>Usage:</b> Use for hiring and timeline planning.',
            // Layer 3 - Appendix
            'appendix-cost': '<b>Context:</b> International salary data.<br><b>Importance:</b> Grounds budget in reality.<br><b>Usage:</b> Multiply hours by local rates.',
            'appendix-roi': '<b>Context:</b> Business case scenarios.<br><b>Importance:</b> Justifies investment.<br><b>Usage:</b> Present to finance and leadership.',
            'appendix-decisions': '<b>Context:</b> Risk decision matrix.<br><b>Importance:</b> Documents accountability.<br><b>Usage:</b> Get sign-off on high-risk items.',
            'appendix-figma': '<b>Context:</b> Copy-paste AI prompts.<br><b>Importance:</b> Speeds up design work.<br><b>Usage:</b> Use directly in Figma AI.',
            'appendix-qa': '<b>Context:</b> Design quality checklist.<br><b>Importance:</b> Catches issues pre-dev.<br><b>Usage:</b> Run on every design file.'
        };
        return descriptions[sectionId] || '<b>Context:</b> Additional topic details.<br><b>Importance:</b> Provides supplementary info.<br><b>Usage:</b> Reference as needed.';
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
    // Use requestAnimationFrame for more reliable DOM readiness than magic timeout
    const initWhenReady = () => {
        const container = document.getElementById('output-layer-tabs');
        if (container && window.OutputRenderer) {
            window.OutputRenderer.init();
        } else {
            // Retry on next frame if not ready yet
            requestAnimationFrame(initWhenReady);
        }
    };
    requestAnimationFrame(initWhenReady);
});

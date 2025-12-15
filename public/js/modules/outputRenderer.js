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
            'exec-problem': 'Összefoglalja a fő problémát és a megoldásunk célját egyszerű nyelven.',
            'exec-domain': 'Megmutatja a lehetséges szakterületeket és a kockázati szintet.',
            'exec-baseline': 'Az iparági sztenderdek: mentális modellek, tipikus folyamatok, gyakori hibák és KPI-k.',
            'exec-northstar': 'Az egyetlen legfontosabb metrika, ami a sikert méri.',
            'exec-breakers': 'A top 5 kritikus kockázat, ami megakadályozhatja a sikert.',
            // Layer 1 Plus - Buyer Summary
            'buyer-package': 'Mit kapsz a 3 rétegben: One Pager, Build Pack, Appendix.',
            'buyer-timeline': 'Lépésről lépésre útmutató az első napokra.',
            'buyer-data': 'Hogyan értelmezd a riportokat és az adatokat.',
            'buyer-responsibilities': 'Mi a te feladatod és mi a miénk.',
            // Layer 2 - Build Pack
            'build-assumptions': 'Feltételezések listája, amiket validálni kell a projekt előtt.',
            'build-strategy': 'Jobs To Be Done, félelmek, értékcsere térkép.',
            'build-research': 'Kutatási terv: interjúk, tesztek, validációs módszerek.',
            'build-ux': 'Teljes felhasználói út a csomagválasztástól a riportig.',
            'build-screens': 'Mind a 8 képernyő specifikációja: cél, sikerkritérium, edge case-ek.',
            'build-validation': 'Validációs szabályok: mikor és hogyan jelenjen meg hiba.',
            'build-rationale': 'Miért pont így döntöttünk - user, business, tech szempontból.',
            'build-resilience': 'Hibakezelés: mi történik ha elromlik valami, hogyan állunk helyre.',
            'build-quality': 'Design minőségi checklist: láthatóság, hibaprevenció, felismerhetőség.',
            'build-specs': 'Technikai spec: komponensek, event tracking, API-k.',
            'build-tech': 'Architektúra: frontend, backend, adatbázis, integrációk.',
            'build-team': 'Csapat felépítés és 4 hetes fázisterv.',
            // Layer 3 - Appendix
            'appendix-cost': 'Nemzetközi bérköltség benchmark és MVP költségbecslés.',
            'appendix-roi': 'Üzleti eset: worst/expected/best case szcenáriók.',
            'appendix-decisions': 'Döntési táblázat: user impact, business impact, confidence, validáció.',
            'appendix-figma': 'Figma AI promptok: copy-paste készen a designhoz.',
            'appendix-qa': 'QA checklist a Figma outputhoz.'
        };
        return descriptions[sectionId] || 'Ez a szekció további részleteket tartalmaz a témával kapcsolatban.';
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

// ===========================================
// STREAMING OUTPUT RENDERER MODULE
// Renders 4-part multi-turn AI analysis
// ===========================================

const StreamingOutputModule = (function () {
    'use strict';

    // Part configuration with descriptions
    const PART_CONFIG = {
        1: {
            id: 'part-1',
            title: 'Discovery & Problem Analysis',
            icon: 'ph-magnifying-glass',
            color: 'indigo',
            description: `<b>Mi ez?</b> Az elemzés első része, amely feltárja a probléma gyökereit és kontextusát.
                <br><b>Miért fontos?</b> Minden sikeres UX stratégia alapos problémamegértésen alapul. Ez a szakasz biztosítja, hogy a megoldás valós igényekre épüljön.
                <br><b>Hogyan használd?</b> Olvasd át az Assumption Ledger-t és validáld a feltételezéseket a csapatoddal mielőtt továbblépnél.`,
            sections: [
                { key: 'Executive Summary', title: 'Executive Summary', icon: 'ph-note', desc: 'Probléma + megközelítés + várható eredmény 3-4 mondatban.' },
                { key: 'Adaptive Problem Analysis', title: 'Adaptive Problem Analysis', icon: 'ph-chart-pie', desc: 'Feladat típus, felhasználói bázis, komplexitás és korlátok azonosítása.' },
                { key: 'Core Problem Statement', title: 'Core Problem Statement (JTBD)', icon: 'ph-target', desc: 'Jobs To Be Done keretrendszer: mit akar elérni a felhasználó?' },
                { key: 'Tailored Methodology', title: 'Tailored Methodology Selection', icon: 'ph-brain', desc: 'Kiválasztott kutatási módszerek és azok indoklása.' },
                { key: 'Assumption Ledger', title: 'Assumption Ledger', icon: 'ph-warning', desc: 'Validálandó feltételezések táblázata konfidencia szintekkel.' }
            ]
        },
        2: {
            id: 'part-2',
            title: 'Strategic Design & Roadmap',
            icon: 'ph-map-trifold',
            color: 'purple',
            description: `<b>Mi ez?</b> A másodok rész, amely stratégiai tervezést és ütemtervet tartalmaz.
                <br><b>Miért fontos?</b> Ez a roadmap biztosítja, hogy a csapat tudja mit kell tenni, mikor és milyen sorrendben.
                <br><b>Hogyan használd?</b> Használd a Phase-by-Phase Roadmap-et a sprint tervezéshez és az Error Paths szekciót a hibaállapotok megtervezéséhez.`,
            sections: [
                { key: 'Tailored Methodology', title: 'Design Methodology', icon: 'ph-pencil-ruler', desc: 'Ideation és design módszerek (Service Blueprint, Journey Map, stb.)' },
                { key: 'Phase-by-Phase Roadmap', title: 'Phase-by-Phase Roadmap', icon: 'ph-calendar', desc: 'Heti/havi bontás deliverables-szel és döntési pontokkal.' },
                { key: 'Critical Workstream', title: 'Error Paths & Recovery Flows', icon: 'ph-warning-octagon', desc: 'Top 5-7 failure szcenárió és recovery UX.' },
                { key: 'Behind the Decision', title: '"Behind the Decision" Notes', icon: 'ph-lightbulb', desc: 'Miért ezt a megközelítést választottuk alternatívák helyett.' }
            ]
        },
        3: {
            id: 'part-3',
            title: 'AI Toolkit & Figma Prompts',
            icon: 'ph-robot',
            color: 'cyan',
            description: `<b>Mi ez?</b> Gyakorlati eszköztár és 10 production-ready Figma AI prompt.
                <br><b>Miért fontos?</b> Ezek a promptok konkrét, azonnal használható design utasítások WCAG AA megfeleléssel.
                <br><b>Hogyan használd?</b> Másold be a promptokat közvetlenül Figma AI-ba vagy ChatGPT-be a mockupok generálásához.`,
            sections: [
                { key: 'AI-Enhanced Execution Toolkit', title: 'AI-Enhanced Execution Toolkit', icon: 'ph-magic-wand', desc: 'AI eszközök fázisonként: Research, Design, Validation.' },
                { key: 'Deliverables Framework', title: 'Deliverables Framework', icon: 'ph-package', desc: 'Szállítandó dokumentumok komplexitás alapján.' },
                { key: '10 Production-Ready Figma', title: '10 Figma AI Prompts', icon: 'ph-figma-logo', desc: 'Valódi microcopy, layout specs, accessibility, error states.' }
            ]
        },
        4: {
            id: 'part-4',
            title: 'Risk, Metrics & Rationale',
            icon: 'ph-shield-check',
            color: 'green',
            description: `<b>Mi ez?</b> Kockázatelemzés, mérőszámok és stratégiai indoklás.
                <br><b>Miért fontos?</b> Ez biztosítja, hogy a projekt mérhető legyen és a kockázatok kezeltek.
                <br><b>Hogyan használd?</b> Használd a Risk Mitigation Plan-t stakeholder prezentációkhoz és a Success Metrics-et a post-launch mérésekhez.`,
            sections: [
                { key: 'Team & Collaboration', title: 'Team & Collaboration Model', icon: 'ph-users', desc: 'Ajánlott csapatösszetétel és együttműködési formátumok.' },
                { key: 'Risk Mitigation', title: 'Risk Mitigation Plan', icon: 'ph-shield-warning', desc: '5 kritikus UX & product rizikó mitigációval.' },
                { key: 'Success Metrics', title: 'Success Metrics & Validation', icon: 'ph-chart-line-up', desc: 'Kvalitatív és kvantitatív metrikák, OKR alignment.' },
                { key: 'Behind the Decision', title: '"Behind the Decision" Layer', icon: 'ph-lightbulb', desc: 'Meta-szintű indoklás a módszertan választásáról.' },
                { key: 'Verification', title: 'Verification & Integrity Gate', icon: 'ph-check-circle', desc: 'Claims verification status és compliance checkpoints.' }
            ]
        }
    };

    // Color class mapping
    const colorMap = {
        'indigo': { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
        'purple': { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
        'cyan': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
        'green': { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
        'red': { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
        'yellow': { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
        'blue': { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' }
    };

    // Parse markdown content into sections
    function parseMarkdownSections(markdown, partNumber) {
        if (!markdown || typeof markdown !== 'string') return [];

        const config = PART_CONFIG[partNumber];
        if (!config) return [];

        const sections = [];

        // Split by ## headers
        const headerRegex = /^## (.+)$/gm;
        let match;
        const headers = [];

        while ((match = headerRegex.exec(markdown)) !== null) {
            headers.push({ title: match[1].trim(), index: match.index });
        }

        // Extract content between headers
        headers.forEach((header, i) => {
            const startIdx = header.index + header.title.length + 3; // +3 for "## \n"
            const endIdx = headers[i + 1]?.index || markdown.length;
            const content = markdown.slice(startIdx, endIdx).trim();

            // Find matching section config
            const sectionConfig = config.sections.find(s =>
                header.title.toLowerCase().includes(s.key.toLowerCase())
            );

            if (content && content.length > 10) {  // Only add non-empty sections
                sections.push({
                    id: `${config.id}-${i}`,
                    title: header.title,
                    icon: sectionConfig?.icon || 'ph-text-align-left',
                    description: sectionConfig?.desc || 'Részletes elemzési szekció.',
                    content: content,
                    color: config.color
                });
            }
        });

        return sections;
    }

    // Convert markdown to HTML
    function markdownToHtml(markdown) {
        if (!markdown) return '';

        return markdown
            // Headers
            .replace(/^### (.+)$/gm, '<h4 class="text-lg font-bold text-white mt-6 mb-3">$1</h4>')
            .replace(/^#### (.+)$/gm, '<h5 class="text-base font-semibold text-gray-200 mt-4 mb-2">$1</h5>')
            // Bold
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
            // Italic
            .replace(/\*(.+?)\*/g, '<em class="text-gray-300 italic">$1</em>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono text-indigo-300">$1</code>')
            // Tables - convert markdown tables to HTML
            .replace(/\|(.+)\|\n\|[-:\| ]+\|\n((?:\|.+\|\n?)+)/g, (match, header, body) => {
                const headers = header.split('|').filter(h => h.trim()).map(h =>
                    `<th class="px-3 py-2 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">${h.trim()}</th>`
                ).join('');
                const rows = body.trim().split('\n').map(row => {
                    const cells = row.split('|').filter(c => c.trim()).map(c =>
                        `<td class="px-3 py-2 text-sm text-gray-300 border-b border-white/5">${c.trim()}</td>`
                    ).join('');
                    return `<tr class="hover:bg-white/5">${cells}</tr>`;
                }).join('');
                return `<div class="overflow-x-auto mt-4 mb-4"><table class="w-full"><thead class="bg-white/5"><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
            })
            // Bullet lists
            .replace(/^- (.+)$/gm, '<li class="flex items-start gap-2 text-gray-300"><span class="text-indigo-400 mt-1">•</span><span>$1</span></li>')
            .replace(/(<li.*<\/li>\n?)+/g, '<ul class="space-y-2 my-3">$&</ul>')
            // Numbered lists
            .replace(/^\d+\. (.+)$/gm, '<li class="flex items-start gap-2 text-gray-300"><span class="text-indigo-400 font-bold min-w-[1.5rem]">$&</span></li>')
            // Paragraphs
            .replace(/\n\n/g, '</p><p class="text-gray-300 leading-relaxed my-3">')
            // Line breaks
            .replace(/\n/g, '<br>')
            // Wrap in paragraph
            .replace(/^(.+)/, '<p class="text-gray-300 leading-relaxed my-3">$1</p>');
    }

    // Render a single part with all its sections
    function renderPart(partNumber, content, isComplete = false) {
        const config = PART_CONFIG[partNumber];
        if (!config) return '';

        const colors = colorMap[config.color];
        const sections = parseMarkdownSections(content, partNumber);
        const hasContent = sections.length > 0;

        if (!hasContent && !content) {
            return ''; // Hide completely empty parts
        }

        return `
        <div class="part-container mb-6" id="${config.id}">
            <!-- Part Header -->
            <div class="${colors.bg} ${colors.border} border rounded-xl overflow-hidden">
                <div class="part-header p-4 flex items-center gap-3 cursor-pointer" 
                     onclick="StreamingOutputModule.togglePart(${partNumber})">
                    <div class="w-10 h-10 flex items-center justify-center ${colors.bg} rounded-lg">
                        <i class="ph-bold ${config.icon} ${colors.text} text-xl"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold ${colors.text}">PART ${partNumber}</span>
                            ${isComplete ? '<span class="text-green-400 text-xs">✓ Complete</span>' : ''}
                        </div>
                        <h3 class="text-white font-bold">${config.title}</h3>
                    </div>
                    <!-- Info icon -->
                    <div class="relative group" onclick="event.stopPropagation()">
                        <i class="ph-bold ph-info text-gray-500 hover:${colors.text} cursor-help transition"></i>
                        <div class="info-tooltip absolute right-0 top-8 w-72 p-4 bg-gray-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            <p class="text-xs text-gray-300 leading-relaxed">${config.description}</p>
                        </div>
                    </div>
                    <!-- Collapse icon -->
                    <i class="ph-bold ph-caret-down collapse-icon ${colors.text} transition-transform rotate-180"></i>
                </div>
                
                <!-- Part Content -->
                <div class="part-content border-t ${colors.border}">
                    ${sections.length > 0 ? renderSections(sections, partNumber) : renderRawContent(content, partNumber)}
                </div>
            </div>
        </div>
        `;
    }

    // Render sections within a part
    function renderSections(sections, partNumber) {
        return sections.map((section, index) => {
            const colors = colorMap[section.color || 'indigo'];
            const isLongContent = section.content.length > 1500;
            const isCollapsedByDefault = index > 2; // Collapse sections after first 3

            return `
            <div class="section-item border-b ${colors.border} last:border-b-0" id="section-${section.id}">
                <!-- Section Header -->
                <div class="section-header p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition"
                     onclick="StreamingOutputModule.toggleSection('${section.id}')">
                    <i class="ph-bold ${section.icon} ${colors.text} text-lg"></i>
                    <h4 class="flex-1 text-sm font-semibold text-white">${section.title}</h4>
                    <!-- Section Info -->
                    <div class="relative group" onclick="event.stopPropagation()">
                        <i class="ph-bold ph-info text-gray-600 hover:text-indigo-400 text-xs cursor-help transition"></i>
                        <div class="info-tooltip absolute right-0 top-6 w-56 p-3 bg-gray-900 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            <p class="text-[10px] text-gray-300 leading-relaxed">${section.description}</p>
                        </div>
                    </div>
                    <i class="ph-bold ph-caret-down section-collapse-icon text-gray-500 transition-transform ${isCollapsedByDefault ? '' : 'rotate-180'}"></i>
                </div>
                <!-- Section Content -->
                <div class="section-content ${isCollapsedByDefault ? 'hidden' : ''} px-4 pb-4 ${isLongContent ? 'max-h-96 overflow-y-auto scrollbar-thin' : ''}">
                    <div class="prose prose-invert prose-sm max-w-none">
                        ${markdownToHtml(section.content)}
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    // Render raw content for parts without parsed sections
    function renderRawContent(content, partNumber) {
        if (!content) return '<div class="p-4 text-gray-500 text-sm">Waiting for content...</div>';

        const isLongContent = content.length > 2000;

        return `
        <div class="raw-content p-4 ${isLongContent ? 'max-h-[500px] overflow-y-auto scrollbar-thin' : ''}">
            <div class="prose prose-invert prose-sm max-w-none">
                ${markdownToHtml(content)}
            </div>
        </div>
        `;
    }

    // Toggle part visibility
    function togglePart(partNumber) {
        const config = PART_CONFIG[partNumber];
        if (!config) return;

        const container = document.getElementById(config.id);
        if (!container) return;

        const content = container.querySelector('.part-content');
        const icon = container.querySelector('.collapse-icon');

        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            icon.classList.add('rotate-180');
        } else {
            content.classList.add('hidden');
            icon.classList.remove('rotate-180');
        }
    }

    // Toggle section visibility
    function toggleSection(sectionId) {
        const section = document.getElementById(`section-${sectionId}`);
        if (!section) return;

        const content = section.querySelector('.section-content');
        const icon = section.querySelector('.section-collapse-icon');

        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            icon.classList.add('rotate-180');
        } else {
            content.classList.add('hidden');
            icon.classList.remove('rotate-180');
        }
    }

    // Render full 4-part analysis
    function renderFullAnalysis(parts, container) {
        if (!container) {
            container = document.getElementById('output-layer-content') ||
                document.getElementById('streaming-output-container');
        }
        if (!container) return;

        // Filter out empty parts
        const nonEmptyParts = Object.entries(parts)
            .filter(([_, content]) => content && content.trim().length > 0);

        if (nonEmptyParts.length === 0) {
            container.innerHTML = `
            <div class="text-center py-12">
                <i class="ph-bold ph-hourglass text-4xl text-gray-600 mb-4"></i>
                <p class="text-gray-400">Az elemzés még nem áll rendelkezésre.</p>
            </div>
            `;
            return;
        }

        const html = `
        <div class="streaming-analysis-output space-y-4">
            <!-- Tab Navigation -->
            <div class="flex gap-2 flex-wrap mb-4">
                ${Object.entries(PART_CONFIG).map(([num, config]) => {
            const hasContent = parts[num] && parts[num].trim().length > 0;
            const colors = colorMap[config.color];
            return hasContent ? `
                    <button onclick="StreamingOutputModule.scrollToPart(${num})" 
                            class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${colors.bg} ${colors.text} border ${colors.border} hover:opacity-80">
                        <i class="ph-bold ${config.icon}"></i>
                        Part ${num}
                    </button>
                    ` : '';
        }).join('')}
            </div>

            <!-- Expand/Collapse All -->
            <div class="flex gap-2 mb-4">
                <button onclick="StreamingOutputModule.expandAll()" 
                        class="px-3 py-1 text-xs text-gray-400 hover:text-white transition flex items-center gap-1">
                    <i class="ph-bold ph-arrows-out-simple"></i> Összes kinyitása
                </button>
                <button onclick="StreamingOutputModule.collapseAll()" 
                        class="px-3 py-1 text-xs text-gray-400 hover:text-white transition flex items-center gap-1">
                    <i class="ph-bold ph-arrows-in-simple"></i> Összes bezárása
                </button>
            </div>

            <!-- Parts -->
            ${nonEmptyParts.map(([num, content]) => renderPart(parseInt(num), content, true)).join('')}
        </div>
        `;

        container.innerHTML = html;
    }

    // Scroll to specific part
    function scrollToPart(partNumber) {
        const config = PART_CONFIG[partNumber];
        if (!config) return;

        const element = document.getElementById(config.id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Ensure part is expanded
            const content = element.querySelector('.part-content');
            const icon = element.querySelector('.collapse-icon');
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                icon.classList.add('rotate-180');
            }
        }
    }

    // Expand all parts and sections
    function expandAll() {
        document.querySelectorAll('.part-content').forEach(c => c.classList.remove('hidden'));
        document.querySelectorAll('.collapse-icon').forEach(i => i.classList.add('rotate-180'));
        document.querySelectorAll('.section-content').forEach(c => c.classList.remove('hidden'));
        document.querySelectorAll('.section-collapse-icon').forEach(i => i.classList.add('rotate-180'));
    }

    // Collapse all parts and sections
    function collapseAll() {
        document.querySelectorAll('.section-content').forEach(c => c.classList.add('hidden'));
        document.querySelectorAll('.section-collapse-icon').forEach(i => i.classList.remove('rotate-180'));
    }

    // Get part config
    function getPartConfig(partNumber) {
        return PART_CONFIG[partNumber] || null;
    }

    return {
        renderPart,
        renderFullAnalysis,
        togglePart,
        toggleSection,
        scrollToPart,
        expandAll,
        collapseAll,
        getPartConfig,
        markdownToHtml
    };
})();

window.StreamingOutputModule = StreamingOutputModule;

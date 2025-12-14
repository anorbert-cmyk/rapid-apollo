// ===========================================
// OUTPUT CONTENT MODULE - Layer 3: Appendix
// Sections 13-17: Auditability, Evidence, Cost, ROI
// ===========================================

const OutputContentLayer3 = (function () {
    'use strict';

    const layer3 = {
        title: "Appendix",
        subtitle: "Auditability, Evidence, Cost, ROI",
        icon: "ph-files",
        sections: [
            {
                id: "appendix-cost",
                title: "Section 13: International Cost Model",
                icon: "ph-currency-dollar",
                color: "green",
                content: `
                <div class="mb-4">
                    <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">Rate Sourcing</div>
                    <div class="flex flex-wrap gap-2">
                        <span class="px-2 py-1 bg-green-500/10 text-green-400 rounded text-[10px]">Upwork role-based hourly</span>
                        <span class="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-[10px]">Robert Half US benchmarks</span>
                        <span class="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-[10px]">Hays Hungary tech salaries</span>
                    </div>
                </div>
                <div class="overflow-x-auto mb-4">
                    <table class="w-full text-xs">
                        <thead><tr class="text-gray-400 border-b border-white/10">
                            <th class="text-left py-2 px-3">Role</th>
                            <th class="text-left py-2 px-3">Hungary (HUF/mo)</th>
                            <th class="text-left py-2 px-3">Upwork (USD/hr)</th>
                        </tr></thead>
                        <tbody class="text-gray-300">
                            <tr class="border-b border-white/5"><td class="py-2 px-3 text-white">UX/UI Designer</td><td class="py-2 px-3">850k median</td><td class="py-2 px-3">$25-39</td></tr>
                            <tr class="border-b border-white/5"><td class="py-2 px-3 text-white">Frontend Dev</td><td class="py-2 px-3">850k-1.35M</td><td class="py-2 px-3">$20-50</td></tr>
                            <tr class="border-b border-white/5"><td class="py-2 px-3 text-white">DevOps</td><td class="py-2 px-3">950k-1.45M</td><td class="py-2 px-3">$40-85</td></tr>
                            <tr class="border-b border-white/5"><td class="py-2 px-3 text-white">Product Owner</td><td class="py-2 px-3">850k-1.35M</td><td class="py-2 px-3">$40-85</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div class="text-white font-bold text-sm mb-2">MVP Portal Build Cost (6-8 weeks)</div>
                    <div class="grid grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
                        <div class="p-2 bg-white/5 rounded"><span class="text-cyan-400">Design</span><br><span class="text-white">120h</span></div>
                        <div class="p-2 bg-white/5 rounded"><span class="text-cyan-400">FE</span><br><span class="text-white">240h</span></div>
                        <div class="p-2 bg-white/5 rounded"><span class="text-cyan-400">BE</span><br><span class="text-white">240h</span></div>
                        <div class="p-2 bg-white/5 rounded"><span class="text-cyan-400">Data</span><br><span class="text-white">80h</span></div>
                        <div class="p-2 bg-white/5 rounded"><span class="text-cyan-400">QA</span><br><span class="text-white">80h</span></div>
                        <div class="p-2 bg-white/5 rounded"><span class="text-cyan-400">Delivery</span><br><span class="text-white">80h</span></div>
                    </div>
                    <p class="text-xs text-gray-400 mt-2">Overhead multiplier: 1.25-1.5x (meeting, QA, security, admin)</p>
                </div>`
            },
            {
                id: "appendix-roi",
                title: "Section 14: Business Case & ROI",
                icon: "ph-chart-line-up",
                color: "indigo",
                content: `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="p-4 bg-red-500/10 rounded-xl border border-red-500/20 text-center">
                        <div class="text-red-400 font-bold text-xs uppercase mb-1">Worst Case</div>
                        <div class="text-2xl text-white font-bold">2 clients</div>
                        <div class="text-xs text-gray-400">Low retention</div>
                    </div>
                    <div class="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-center">
                        <div class="text-yellow-400 font-bold text-xs uppercase mb-1">Expected</div>
                        <div class="text-2xl text-white font-bold">5 clients</div>
                        <div class="text-xs text-gray-400">3-month retention</div>
                    </div>
                    <div class="p-4 bg-green-500/10 rounded-xl border border-green-500/20 text-center">
                        <div class="text-green-400 font-bold text-xs uppercase mb-1">Best Case</div>
                        <div class="text-2xl text-white font-bold">10 clients</div>
                        <div class="text-xs text-gray-400">6-month retention</div>
                    </div>
                </div>
                <div class="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                    <div class="text-indigo-400 font-bold text-sm mb-3">Impact Hypothesis</div>
                    <ul class="text-sm text-gray-300 space-y-2">
                        <li class="flex items-start gap-2"><i class="ph-bold ph-arrow-up text-green-400"></i> Faster onboarding → more clients activated</li>
                        <li class="flex items-start gap-2"><i class="ph-bold ph-arrow-up text-green-400"></i> Fewer policy/tracking errors → better ROAS & retention</li>
                        <li class="flex items-start gap-2"><i class="ph-bold ph-arrow-up text-green-400"></i> Less manual reporting → more time for execution</li>
                    </ul>
                </div>
                <div class="mt-4 p-3 bg-white/5 rounded-lg">
                    <p class="text-xs text-gray-400"><strong class="text-white">Revenue model:</strong> Setup fee + monthly retainer. <strong class="text-white">Break even:</strong> Fixed cost ÷ gross margin per client</p>
                </div>`
            },
            {
                id: "appendix-decisions",
                title: "Section 15: Decision & Evidence Table",
                icon: "ph-table",
                color: "purple",
                content: `
                <div class="overflow-x-auto">
                    <table class="w-full text-xs">
                        <thead><tr class="text-gray-400 border-b border-white/10">
                            <th class="text-left py-2 px-2">Decision</th>
                            <th class="text-left py-2 px-2">User Impact</th>
                            <th class="text-left py-2 px-2">Business Impact</th>
                            <th class="text-center py-2 px-2">Confidence</th>
                            <th class="text-left py-2 px-2">Validate</th>
                        </tr></thead>
                        <tbody class="text-gray-300">
                            <tr class="border-b border-white/5 hover:bg-white/5">
                                <td class="py-2 px-2 text-white">Progressive disclosure in portal</td>
                                <td class="py-2 px-2">Less overload</td>
                                <td class="py-2 px-2 text-green-400">Better completion</td>
                                <td class="py-2 px-2 text-center"><span class="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[9px]">0.85</span></td>
                                <td class="py-2 px-2">Usability test</td>
                            </tr>
                            <tr class="border-b border-white/5 hover:bg-white/5">
                                <td class="py-2 px-2 text-white">Inline validation + error summary</td>
                                <td class="py-2 px-2">Fast recovery</td>
                                <td class="py-2 px-2 text-green-400">Less drop-off</td>
                                <td class="py-2 px-2 text-center"><span class="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[9px]">0.80</span></td>
                                <td class="py-2 px-2">Form test</td>
                            </tr>
                            <tr class="border-b border-white/5 hover:bg-white/5">
                                <td class="py-2 px-2 text-white">Web3 marketing compliance gating</td>
                                <td class="py-2 px-2">Less reputation damage</td>
                                <td class="py-2 px-2 text-green-400">Less legal risk</td>
                                <td class="py-2 px-2 text-center"><span class="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-[9px]">0.70</span></td>
                                <td class="py-2 px-2">Legal review</td>
                            </tr>
                            <tr class="border-b border-white/5 hover:bg-white/5">
                                <td class="py-2 px-2 text-white">Crypto ads certification workflow</td>
                                <td class="py-2 px-2">Fewer rejections</td>
                                <td class="py-2 px-2 text-green-400">Stable lead gen</td>
                                <td class="py-2 px-2 text-center"><span class="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-[9px]">0.75</span></td>
                                <td class="py-2 px-2">Cert pilot</td>
                            </tr>
                            <tr class="border-b border-white/5 hover:bg-white/5">
                                <td class="py-2 px-2 text-white">Approval ledger for irreversible steps</td>
                                <td class="py-2 px-2">Trust</td>
                                <td class="py-2 px-2 text-green-400">Less dispute</td>
                                <td class="py-2 px-2 text-center"><span class="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[9px]">0.80</span></td>
                                <td class="py-2 px-2">Incident review</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div class="text-red-400 font-bold text-xs mb-1">Top 3 Risk Decisions</div>
                    <div class="flex flex-wrap gap-2">
                        <span class="px-2 py-1 bg-red-500/20 text-red-300 rounded text-[10px]">Web3 compliance gating</span>
                        <span class="px-2 py-1 bg-red-500/20 text-red-300 rounded text-[10px]">Ads policy volatility</span>
                        <span class="px-2 py-1 bg-red-500/20 text-red-300 rounded text-[10px]">AI quality & brand safety</span>
                    </div>
                </div>`
            },
            {
                id: "appendix-figma",
                title: "Section 16: Figma AI Prompt Pack",
                icon: "ph-figma-logo",
                color: "pink",
                content: `
                <div class="space-y-4">
                    <div class="p-4 bg-pink-500/10 rounded-xl border border-pink-500/20">
                        <div class="flex items-center justify-between mb-2">
                            <div class="text-pink-400 font-bold text-sm">Prompt A: High Fidelity Happy Path UI</div>
                            <button onclick="copyToClipboard('figma-prompt-a')" class="px-2 py-1 bg-white/10 rounded text-xs text-gray-400 hover:text-white transition">Copy</button>
                        </div>
                        <pre id="figma-prompt-a" class="text-xs text-gray-300 bg-black/30 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">Platform: Web app
Frames: Desktop 1440x1024, Tablet 834x1112, Mobile 390x844
Layout: 12 column grid desktop, 8pt spacing system
Typography: H1 32, H2 24, body 16, caption 13
Visual: premium, enterprise, clean cards, subtle shadows

Create 8 core screens:
1. Landing and pricing
2. Checkout with card and crypto
3. Onboarding step 1 goals
4. Onboarding step 2 integrations
5. Strategy dashboard 30-day timeline
6. Campaign brief builder AI draft
7. Reports with What changed / What to do
8. Support and approvals queue</pre>
                    </div>
                    <div class="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <div class="flex items-center justify-between mb-2">
                            <div class="text-purple-400 font-bold text-sm">Prompt B: Critical Error & Recovery UI</div>
                            <button onclick="copyToClipboard('figma-prompt-b')" class="px-2 py-1 bg-white/10 rounded text-xs text-gray-400 hover:text-white transition">Copy</button>
                        </div>
                        <pre id="figma-prompt-b" class="text-xs text-gray-300 bg-black/30 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">Deep dive 1: Integration token expired
- Dashboard with connector status disconnected
- Inline recovery card with Reconnect button

Deep dive 2: Irreversible campaign launch
- Review screen with budget/targeting/creative
- Confirmation modal with explicit warning
- Failure state when platform rejects

Include: Banner error summary, inline field errors, retry actions</pre>
                    </div>
                    <div class="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                        <div class="flex items-center justify-between mb-2">
                            <div class="text-cyan-400 font-bold text-sm">Prompt C: Component Library</div>
                            <button onclick="copyToClipboard('figma-prompt-c')" class="px-2 py-1 bg-white/10 rounded text-xs text-gray-400 hover:text-white transition">Copy</button>
                        </div>
                        <pre id="figma-prompt-c" class="text-xs text-gray-300 bg-black/30 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">Create component page with:
- Buttons: 3 variants, all states
- Inputs, textareas: all states
- Select, dropdown, stepper states
- Cards and table rows
- Status chips including risk levels
- Banner, toast, modal, skeleton

Use 8pt spacing, clear naming convention
Show do/don't for error messaging</pre>
                    </div>
                </div>`
            },
            {
                id: "appendix-qa",
                title: "Section 17: Figma Prompt QA Gate",
                icon: "ph-check-square",
                color: "yellow",
                content: `
                <div class="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20 mb-4">
                    <div class="text-yellow-400 font-bold text-sm mb-3">QA Checklist</div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label class="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" class="rounded"> Real text everywhere (no Lorem)</label>
                        <label class="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" class="rounded"> Auto-layout rules documented</label>
                        <label class="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" class="rounded"> States: loading, error, success, empty</label>
                        <label class="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" class="rounded"> Focus & keyboard intent included</label>
                    </div>
                </div>
                <div class="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div class="text-white font-bold text-sm mb-2">Execution Order</div>
                    <ol class="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                        <li>Happy path first (Prompt A)</li>
                        <li>Error states second (Prompt B)</li>
                        <li>Component library last (Prompt C)</li>
                    </ol>
                </div>
                <div class="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div class="text-red-400 font-bold text-xs mb-1">⚠️ Important Web3 & Ads Policy Note</div>
                    <p class="text-xs text-gray-300">Crypto ads require platform-specific certification (Google) and MiCA CASP authorization in EU. Always use "clear, non-misleading" language consistent with official materials.</p>
                </div>`
            }
        ]
    };

    function getLayer3() {
        return layer3;
    }

    return { getLayer3 };
})();

window.OutputContentLayer3 = OutputContentLayer3;

// ===========================================
// OUTPUT CONTENT MODULE - Layer 2: Build Pack
// Sections 1-12: Implementation Ready
// ===========================================

const OutputContentLayer2 = (function () {
    'use strict';

    const layer2 = {
        title: "Build Pack",
        subtitle: "Implementation Ready",
        icon: "ph-hammer",
        sections: [
            {
                id: "build-assumptions",
                title: "Section 1: Assumption Ledger & Scope Lock",
                icon: "ph-clipboard-text",
                color: "indigo",
                content: `
                <div class="overflow-x-auto mb-6">
                    <table class="w-full text-xs">
                        <thead>
                            <tr class="text-gray-400 border-b border-white/10">
                                <th class="text-left py-2 px-3">Assumption</th>
                                <th class="text-left py-2 px-3">Why It Matters</th>
                                <th class="text-center py-2 px-3">Confidence</th>
                                <th class="text-center py-2 px-3">Risk</th>
                                <th class="text-left py-2 px-3">Quick Validation</th>
                            </tr>
                        </thead>
                        <tbody class="text-gray-300">
                            <tr class="border-b border-white/5 hover:bg-white/5">
                                <td class="py-3 px-3 text-white">Client portal (not just manual agency)</td>
                                <td class="py-3 px-3">Scaling, transparency, retention</td>
                                <td class="py-3 px-3 text-center"><span class="text-green-400">0.75</span></td>
                                <td class="py-3 px-3 text-center"><span class="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-[9px]">MEDIUM</span></td>
                                <td class="py-3 px-3">5 client interviews</td>
                            </tr>
                            <tr class="border-b border-white/5 hover:bg-white/5">
                                <td class="py-3 px-3 text-white">Web3 clients will come</td>
                                <td class="py-3 px-3">Compliance complexity increases</td>
                                <td class="py-3 px-3 text-center"><span class="text-yellow-400">0.6</span></td>
                                <td class="py-3 px-3 text-center"><span class="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[9px]">HIGH</span></td>
                                <td class="py-3 px-3">10 discovery calls</td>
                            </tr>
                            <tr class="border-b border-white/5 hover:bg-white/5">
                                <td class="py-3 px-3 text-white">Channels: Google, Meta, X, email, SEO</td>
                                <td class="py-3 px-3">Tooling and ops feasible</td>
                                <td class="py-3 px-3 text-center"><span class="text-green-400">0.7</span></td>
                                <td class="py-3 px-3 text-center"><span class="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-[9px]">MEDIUM</span></td>
                                <td class="py-3 px-3">2-week pilot with 1 client</td>
                            </tr>
                            <tr class="border-b border-white/5 hover:bg-white/5">
                                <td class="py-3 px-3 text-white">AI generates content, human approves</td>
                                <td class="py-3 px-3">Reputation & compliance protection</td>
                                <td class="py-3 px-3 text-center"><span class="text-green-400">0.9</span></td>
                                <td class="py-3 px-3 text-center"><span class="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-[9px]">MEDIUM</span></td>
                                <td class="py-3 px-3">20 asset test + QA checklist</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                        <div class="text-green-400 font-bold text-xs uppercase mb-2">✓ In Scope</div>
                        <ul class="text-sm text-gray-300 space-y-1">
                            <li>• Productized agency packages</li>
                            <li>• Onboarding, brief, approvals, launch, report</li>
                            <li>• Measurement, event taxonomy</li>
                            <li>• Edge cases and recovery</li>
                            <li>• Web3 policy & compliance gating</li>
                        </ul>
                    </div>
                    <div class="p-4 bg-gray-500/10 rounded-xl border border-gray-500/20">
                        <div class="text-gray-400 font-bold text-xs uppercase mb-2">✗ Out of Scope (Phase 2)</div>
                        <ul class="text-sm text-gray-400 space-y-1">
                            <li>• Full automated media buying without humans</li>
                            <li>• Tokenomics design, legal advice</li>
                            <li>• Custody, private key management</li>
                        </ul>
                    </div>
                </div>`
            },
            {
                id: "build-strategy",
                title: "Section 2: Product Strategy",
                icon: "ph-strategy",
                color: "purple",
                content: `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <div class="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                            <div class="text-purple-400 font-bold text-xs uppercase mb-2">Primary JTBD</div>
                            <p class="text-white text-sm italic">"I want to go to market quickly, knowing I can measure what works, without burning our reputation."</p>
                        </div>
                        <div class="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                            <div class="text-indigo-400 font-bold text-xs uppercase mb-2">Secondary JTBD</div>
                            <p class="text-gray-300 text-sm italic">"I want someone to assemble the full launch system: message, channel, creative, measurement, rhythm."</p>
                        </div>
                    </div>
                    <div class="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                        <div class="text-red-400 font-bold text-xs uppercase mb-2">User Anxieties & Trust Blockers</div>
                        <ul class="text-sm text-gray-300 space-y-2">
                            <li class="flex items-start gap-2"><i class="ph-bold ph-warning text-red-400 mt-0.5"></i> "I hand over access, what happens?"</li>
                            <li class="flex items-start gap-2"><i class="ph-bold ph-warning text-red-400 mt-0.5"></i> "AI-generated bullshit"</li>
                            <li class="flex items-start gap-2"><i class="ph-bold ph-warning text-red-400 mt-0.5"></i> "Web3 = looks like a scam"</li>
                            <li class="flex items-start gap-2"><i class="ph-bold ph-warning text-red-400 mt-0.5"></i> "You'll spend my money on bad ads"</li>
                            <li class="flex items-start gap-2"><i class="ph-bold ph-warning text-red-400 mt-0.5"></i> "I won't understand the report"</li>
                        </ul>
                    </div>
                </div>
                <div class="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div class="text-white font-bold text-sm mb-3">Value Exchange Map</div>
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div class="text-xs text-gray-400 mb-1">Client Gives</div>
                            <div class="text-sm text-gray-300">Access, info, budget, approval</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-400 mb-1">Client Gets</div>
                            <div class="text-sm text-gray-300">Launch plan, execution, measurement, learnings</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-400 mb-1">Why Now</div>
                            <div class="text-sm text-gray-300">Channels change fast, AI accelerates (with control)</div>
                        </div>
                    </div>
                </div>`
            },
            {
                id: "build-research",
                title: "Section 3: Research & Evidence Plan",
                icon: "ph-magnifying-glass",
                color: "blue",
                content: `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center">
                        <div class="text-blue-400 font-bold mb-1">Discovery</div>
                        <div class="text-2xl text-white font-bold">Low</div>
                        <div class="text-xs text-gray-400">Agency starting</div>
                    </div>
                    <div class="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-center">
                        <div class="text-cyan-400 font-bold mb-1">Evaluative</div>
                        <div class="text-2xl text-white font-bold">Medium</div>
                        <div class="text-xs text-gray-400">Quick pilot needed</div>
                    </div>
                    <div class="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 text-center">
                        <div class="text-purple-400 font-bold mb-1">IA</div>
                        <div class="text-2xl text-white font-bold">Medium</div>
                        <div class="text-xs text-gray-400">Portal mental model critical</div>
                    </div>
                </div>
                <div class="p-4 bg-white/5 rounded-xl border border-white/10 mb-4">
                    <div class="text-white font-bold text-sm mb-2">Primary Method</div>
                    <p class="text-gray-300 text-sm">8-10 "launch readiness" interviews (Web2 & Web3 mixed)</p>
                    <p class="text-gray-400 text-xs mt-1">Why: Quickly reveals real ops and trust blockers</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-3 bg-white/5 rounded-lg">
                        <div class="text-xs text-green-400 font-bold mb-2">Add-ons</div>
                        <ul class="text-sm text-gray-300 space-y-1">
                            <li>• Landing smoke test (3 packages)</li>
                            <li>• Concierge pilot with 2 clients for 2 weeks</li>
                        </ul>
                    </div>
                    <div class="p-3 bg-white/5 rounded-lg">
                        <div class="text-xs text-cyan-400 font-bold mb-2">Recruiting Criteria</div>
                        <ul class="text-sm text-gray-300 space-y-1">
                            <li>• Web2: SaaS founder or growth lead</li>
                            <li>• Web3: Protocol founder, community lead</li>
                            <li>• All: Had ad spend or preparing to</li>
                        </ul>
                    </div>
                </div>`
            },
            {
                id: "build-ux",
                title: "Section 4: UX Blueprint End-to-End",
                icon: "ph-layout",
                color: "cyan",
                content: `
                <div class="mb-6">
                    <div class="text-white font-bold text-sm mb-3">Target Journey & Moments of Truth</div>
                    <div class="flex flex-wrap gap-2">
                        <span class="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-full text-xs">1. Package Selection</span>
                        <i class="ph-bold ph-arrow-right text-gray-600"></i>
                        <span class="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-full text-xs">2. Payment & Access Trust</span>
                        <i class="ph-bold ph-arrow-right text-gray-600"></i>
                        <span class="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-full text-xs">3. Onboarding, Goals, Tracking</span>
                        <i class="ph-bold ph-arrow-right text-gray-600"></i>
                        <span class="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-full text-xs">4. Strategy & Timeline Approval</span>
                        <i class="ph-bold ph-arrow-right text-gray-600"></i>
                        <span class="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-xs">5. Campaign Launch w/ Approval</span>
                        <i class="ph-bold ph-arrow-right text-gray-600"></i>
                        <span class="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-xs">6. First Report & Guidance</span>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div class="text-white font-bold text-sm mb-3">IA & Navigation Model</div>
                        <div class="flex flex-wrap gap-2">
                            <span class="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs">Dashboard</span>
                            <span class="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">Strategy</span>
                            <span class="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-xs">Campaigns</span>
                            <span class="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">Assets</span>
                            <span class="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">Reports</span>
                            <span class="px-2 py-1 bg-gray-500/20 text-gray-300 rounded text-xs">Support</span>
                        </div>
                        <p class="text-xs text-gray-400 mt-3">Mental model: "Where are we?", "What did you do?", "What's next?"</p>
                    </div>
                    <div class="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div class="text-white font-bold text-sm mb-3">Gating Rules</div>
                        <ul class="text-sm text-gray-300 space-y-2">
                            <li class="flex items-start gap-2"><i class="ph-bold ph-lock text-yellow-400"></i> Irreversible steps: always explicit approval</li>
                            <li class="flex items-start gap-2"><i class="ph-bold ph-shield-check text-green-400"></i> Web3 marketing: compliance checklist pass required, else "hold"</li>
                        </ul>
                    </div>
                </div>`
            },
            {
                id: "build-screens",
                title: "Section 5: Screen-by-Screen Spec (8 Screens)",
                icon: "ph-devices",
                color: "green",
                content: `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-indigo-500/30 transition">
                        <div class="text-indigo-400 font-bold text-xs mb-2">Screen 1</div>
                        <div class="text-white font-medium text-sm mb-1">Landing & Packages</div>
                        <p class="text-xs text-gray-400">Purpose: Trust, quick decision</p>
                        <p class="text-xs text-gray-400">Success: Package click, lead submit</p>
                    </div>
                    <div class="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-indigo-500/30 transition">
                        <div class="text-indigo-400 font-bold text-xs mb-2">Screen 2</div>
                        <div class="text-white font-medium text-sm mb-1">Checkout & Payment</div>
                        <p class="text-xs text-gray-400">Card & crypto options</p>
                        <p class="text-xs text-gray-400">Edge: underpayment, pending</p>
                    </div>
                    <div class="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-500/30 transition">
                        <div class="text-cyan-400 font-bold text-xs mb-2">Screen 3</div>
                        <div class="text-white font-medium text-sm mb-1">Onboarding - Goals</div>
                        <p class="text-xs text-gray-400">Company, domain, launch type</p>
                        <p class="text-xs text-gray-400">Inline validation on blur</p>
                    </div>
                    <div class="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-500/30 transition">
                        <div class="text-cyan-400 font-bold text-xs mb-2">Screen 4</div>
                        <div class="text-white font-medium text-sm mb-1">Onboarding - Integrations</div>
                        <p class="text-xs text-gray-400">GA, Meta, Google Ads, CRM</p>
                        <p class="text-xs text-gray-400 text-red-400">Never seed phrase!</p>
                    </div>
                    <div class="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/30 transition">
                        <div class="text-purple-400 font-bold text-xs mb-2">Screen 5</div>
                        <div class="text-white font-medium text-sm mb-1">Strategy Dashboard</div>
                        <p class="text-xs text-gray-400">30-day timeline, deliverables</p>
                        <p class="text-xs text-gray-400">Risks & mitigations</p>
                    </div>
                    <div class="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/30 transition">
                        <div class="text-purple-400 font-bold text-xs mb-2">Screen 6</div>
                        <div class="text-white font-medium text-sm mb-1">Campaigns & Brief Builder</div>
                        <p class="text-xs text-gray-400">AI draft → human review → approval</p>
                    </div>
                    <div class="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-green-500/30 transition">
                        <div class="text-green-400 font-bold text-xs mb-2">Screen 7</div>
                        <div class="text-white font-medium text-sm mb-1">Reports & Insights</div>
                        <p class="text-xs text-gray-400">North Star progress</p>
                        <p class="text-xs text-gray-400">"What changed" + "What to do"</p>
                    </div>
                    <div class="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-green-500/30 transition">
                        <div class="text-green-400 font-bold text-xs mb-2">Screen 8</div>
                        <div class="text-white font-medium text-sm mb-1">Support & Approvals</div>
                        <p class="text-xs text-gray-400">Approval queue, incident log</p>
                        <p class="text-xs text-gray-400">Billing docs</p>
                    </div>
                </div>`
            },
            {
                id: "build-validation",
                title: "Section 6: Validation Rules",
                icon: "ph-check-circle",
                color: "yellow",
                content: `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                        <i class="ph-bold ph-warning text-yellow-400 text-2xl mb-2"></i>
                        <div class="text-white font-bold text-sm">Inline Errors</div>
                        <p class="text-xs text-gray-400 mt-1">Show error where the field is</p>
                    </div>
                    <div class="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                        <i class="ph-bold ph-list-checks text-yellow-400 text-2xl mb-2"></i>
                        <div class="text-white font-bold text-sm">Summary at Top</div>
                        <p class="text-xs text-gray-400 mt-1">If multiple errors, show summary</p>
                    </div>
                    <div class="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                        <i class="ph-bold ph-timer text-yellow-400 text-2xl mb-2"></i>
                        <div class="text-white font-bold text-sm">Blur + Submit</div>
                        <p class="text-xs text-gray-400 mt-1">Don't spam errors while typing</p>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs">
                        <thead>
                            <tr class="text-gray-400 border-b border-white/10">
                                <th class="text-left py-2 px-3">Field</th>
                                <th class="text-left py-2 px-3">Validation</th>
                                <th class="text-left py-2 px-3">Error Message</th>
                            </tr>
                        </thead>
                        <tbody class="text-gray-300">
                            <tr class="border-b border-white/5">
                                <td class="py-2 px-3 text-white">Email</td>
                                <td class="py-2 px-3">Format (client) + deliverability (server)</td>
                                <td class="py-2 px-3 text-red-400">Please enter a valid email</td>
                            </tr>
                            <tr class="border-b border-white/5">
                                <td class="py-2 px-3 text-white">Domain</td>
                                <td class="py-2 px-3">DNS check async</td>
                                <td class="py-2 px-3 text-red-400">Could not verify, try later</td>
                            </tr>
                            <tr class="border-b border-white/5">
                                <td class="py-2 px-3 text-white">Wallet Address</td>
                                <td class="py-2 px-3">Checksum + chain selection required</td>
                                <td class="py-2 px-3 text-red-400">Invalid address or chain mismatch</td>
                            </tr>
                            <tr class="border-b border-white/5">
                                <td class="py-2 px-3 text-white">Budget Change</td>
                                <td class="py-2 px-3">Always confirmation + audit log</td>
                                <td class="py-2 px-3 text-yellow-400">Confirm budget change of $X</td>
                            </tr>
                        </tbody>
                    </table>
                </div>`
            }
        ]
    };

    function getLayer2() {
        return layer2;
    }

    return { getLayer2 };
})();

window.OutputContentLayer2 = OutputContentLayer2;

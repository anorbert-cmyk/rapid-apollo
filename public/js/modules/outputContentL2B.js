// ===========================================
// OUTPUT CONTENT MODULE - Layer 2 Part 2 + Layer 3
// Sections 7-12 + Appendix Sections 13-17
// ===========================================

const OutputContentLayer2B = (function () {
    'use strict';

    const sections7to12 = [
        {
            id: "build-rationale",
            title: "Section 7: Validation Rationale",
            icon: "ph-lightbulb",
            color: "orange",
            content: `
            <div class="space-y-4">
                <div class="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div class="text-orange-400 font-bold text-sm mb-2">Integration Token Connection</div>
                    <div class="grid grid-cols-4 gap-2 text-xs">
                        <div class="p-2 bg-white/5 rounded"><span class="text-gray-400">User:</span> <span class="text-white">Less frustration, quick recovery</span></div>
                        <div class="p-2 bg-white/5 rounded"><span class="text-gray-400">Business:</span> <span class="text-white">Fewer tickets, less lost onboarding</span></div>
                        <div class="p-2 bg-white/5 rounded"><span class="text-gray-400">Tech:</span> <span class="text-white">Token expiry normal, retry needed</span></div>
                        <div class="p-2 bg-white/5 rounded"><span class="text-gray-400">Tradeoff:</span> <span class="text-white">Modal for every error = too much</span></div>
                    </div>
                </div>
                <div class="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div class="text-red-400 font-bold text-sm mb-2">Irreversible Campaign Launch</div>
                    <div class="grid grid-cols-4 gap-2 text-xs">
                        <div class="p-2 bg-white/5 rounded"><span class="text-gray-400">User:</span> <span class="text-white">Avoids accidental spend</span></div>
                        <div class="p-2 bg-white/5 rounded"><span class="text-gray-400">Business:</span> <span class="text-white">Fewer refunds, less dispute</span></div>
                        <div class="p-2 bg-white/5 rounded"><span class="text-gray-400">Tech:</span> <span class="text-white">Audit + idempotency required</span></div>
                        <div class="p-2 bg-white/5 rounded"><span class="text-gray-400">Pattern:</span> <span class="text-white">Review screen + explicit confirm</span></div>
                    </div>
                </div>
            </div>`
        },
        {
            id: "build-resilience",
            title: "Section 8: Resilience & Error Recovery Map",
            icon: "ph-shield-check",
            color: "red",
            content: `
            <div class="mb-4">
                <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">Failure Mode Catalog</div>
                <div class="flex flex-wrap gap-2">
                    <span class="px-2 py-1 bg-red-500/10 text-red-400 rounded text-[10px]">Network timeout</span>
                    <span class="px-2 py-1 bg-red-500/10 text-red-400 rounded text-[10px]">Duplicate submit</span>
                    <span class="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded text-[10px]">Token expired</span>
                    <span class="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded text-[10px]">Creative rejection</span>
                    <span class="px-2 py-1 bg-red-500/10 text-red-400 rounded text-[10px]">Account suspension</span>
                    <span class="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded text-[10px]">Payment pending</span>
                    <span class="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded text-[10px]">Crypto underpayment</span>
                    <span class="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-[10px]">AI generation timeout</span>
                    <span class="px-2 py-1 bg-red-500/10 text-red-400 rounded text-[10px]">Policy risk flag</span>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                    <div class="text-yellow-400 font-bold text-xs uppercase mb-2">Deep Dive 1: Token Expired (Most Likely)</div>
                    <p class="text-sm text-gray-300 mb-2"><strong>Trigger:</strong> Meta/Google token expires, data pull fails</p>
                    <p class="text-sm text-gray-300 mb-2"><strong>UI:</strong> Inline status chip "Disconnected" + Reconnect CTA</p>
                    <p class="text-sm text-white italic">"Connection expired. This is normal. Click Reconnect and it'll restore in 30 seconds."</p>
                </div>
                <div class="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                    <div class="text-red-400 font-bold text-xs uppercase mb-2">Deep Dive 2: Campaign Launch (Highest Risk)</div>
                    <p class="text-sm text-gray-300 mb-2"><strong>Trigger:</strong> User approves, spend starts</p>
                    <p class="text-sm text-gray-300 mb-2"><strong>UI:</strong> Review screen + explicit confirmation modal</p>
                    <p class="text-sm text-white italic">"This step starts a live campaign and spending begins. Please verify budget, targeting, and ad copy."</p>
                </div>
            </div>`
        },
        {
            id: "build-quality",
            title: "Section 9: Design Quality Audit",
            icon: "ph-star",
            color: "purple",
            content: `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <i class="ph-bold ph-eye text-purple-400 text-xl mb-2"></i>
                    <div class="text-white font-bold text-sm">Visibility of Status</div>
                    <p class="text-xs text-gray-400 mt-1">Every connector and campaign status visible at all times</p>
                </div>
                <div class="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                    <i class="ph-bold ph-shield-warning text-yellow-400 text-xl mb-2"></i>
                    <div class="text-white font-bold text-sm">Error Prevention</div>
                    <p class="text-xs text-gray-400 mt-1">Review before irreversible steps</p>
                </div>
                <div class="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                    <i class="ph-bold ph-brain text-green-400 text-xl mb-2"></i>
                    <div class="text-white font-bold text-sm">Recognition > Recall</div>
                    <p class="text-xs text-gray-400 mt-1">"What to do now" on dashboard</p>
                </div>
            </div>
            <div class="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div class="text-white font-bold text-sm mb-2">Accessibility Intent</div>
                <ul class="text-sm text-gray-300 space-y-1">
                    <li>• Error messages programmatically announced, focus on error</li>
                    <li>• Progressive disclosure, don't dump everything at once</li>
                    <li>• WCAG 2.2 compliance targeted</li>
                </ul>
            </div>`
        },
        {
            id: "build-specs",
            title: "Section 10: Implementation Specs",
            icon: "ph-code",
            color: "cyan",
            content: `
            <div class="mb-4">
                <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">Component Inventory</div>
                <div class="flex flex-wrap gap-2">
                    <span class="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-[10px]">Button</span>
                    <span class="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-[10px]">Input</span>
                    <span class="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-[10px]">Select</span>
                    <span class="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-[10px]">Stepper</span>
                    <span class="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-[10px]">Card</span>
                    <span class="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-[10px]">StatusChip</span>
                    <span class="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-[10px]">Toast</span>
                    <span class="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-[10px]">Banner</span>
                    <span class="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-[10px]">Table</span>
                    <span class="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-[10px]">Modal</span>
                    <span class="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-[10px]">Skeleton</span>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-xs">
                    <thead><tr class="text-gray-400 border-b border-white/10">
                        <th class="text-left py-2 px-3">Event</th>
                        <th class="text-left py-2 px-3">Trigger</th>
                        <th class="text-left py-2 px-3">Properties</th>
                    </tr></thead>
                    <tbody class="text-gray-300">
                        <tr class="border-b border-white/5"><td class="py-2 px-3 text-white">select_package</td><td class="py-2 px-3">Pricing card click</td><td class="py-2 px-3">package_id, price</td></tr>
                        <tr class="border-b border-white/5"><td class="py-2 px-3 text-white">checkout_completed</td><td class="py-2 px-3">Payment success</td><td class="py-2 px-3">method, amount, currency</td></tr>
                        <tr class="border-b border-white/5"><td class="py-2 px-3 text-white">onboarding_completed</td><td class="py-2 px-3">Wizard finish</td><td class="py-2 px-3">launch_type, connectors</td></tr>
                        <tr class="border-b border-white/5"><td class="py-2 px-3 text-white">approval_submitted</td><td class="py-2 px-3">Approval action</td><td class="py-2 px-3">type, risk_level</td></tr>
                    </tbody>
                </table>
            </div>`
        },
        {
            id: "build-tech",
            title: "Section 11: Tech Implementation Plan",
            icon: "ph-gear",
            color: "indigo",
            content: `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                    <div class="text-indigo-400 font-bold text-sm mb-3">Architecture</div>
                    <ul class="text-sm text-gray-300 space-y-1">
                        <li>• <strong class="text-white">Frontend:</strong> Next.js</li>
                        <li>• <strong class="text-white">Backend:</strong> Node or Python</li>
                        <li>• <strong class="text-white">Database:</strong> Postgres + event pipeline</li>
                        <li>• <strong class="text-white">Connectors:</strong> Separate service, retry + rate limit</li>
                    </ul>
                </div>
                <div class="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <div class="text-purple-400 font-bold text-sm mb-3">Integrations</div>
                    <ul class="text-sm text-gray-300 space-y-1">
                        <li>• OAuth where possible</li>
                        <li>• Webhooks where available, polling where not</li>
                        <li>• Reconciliation, token refresh, failure queue</li>
                    </ul>
                </div>
            </div>
            <div class="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div class="text-white font-bold text-sm mb-2">Reliability</div>
                <div class="grid grid-cols-3 gap-3 text-center text-xs">
                    <div class="p-2 bg-white/5 rounded"><span class="text-green-400 font-bold">&lt;2s</span><br><span class="text-gray-400">Dashboard latency</span></div>
                    <div class="p-2 bg-white/5 rounded"><span class="text-cyan-400 font-bold">Circuit breaker</span><br><span class="text-gray-400">For connectors</span></div>
                    <div class="p-2 bg-white/5 rounded"><span class="text-purple-400 font-bold">Feature flags</span><br><span class="text-gray-400">New channels</span></div>
                </div>
            </div>`
        },
        {
            id: "build-team",
            title: "Section 12: Team & Delivery Model",
            icon: "ph-users-three",
            color: "green",
            content: `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div class="p-3 bg-white/5 rounded-lg text-center"><i class="ph-bold ph-user-circle text-indigo-400 text-xl"></i><div class="text-xs text-white mt-1">PM/Delivery</div></div>
                <div class="p-3 bg-white/5 rounded-lg text-center"><i class="ph-bold ph-chart-line text-green-400 text-xl"></i><div class="text-xs text-white mt-1">Growth Strategist</div></div>
                <div class="p-3 bg-white/5 rounded-lg text-center"><i class="ph-bold ph-megaphone text-purple-400 text-xl"></i><div class="text-xs text-white mt-1">Performance Marketer</div></div>
                <div class="p-3 bg-white/5 rounded-lg text-center"><i class="ph-bold ph-pencil-line text-cyan-400 text-xl"></i><div class="text-xs text-white mt-1">Content Lead</div></div>
                <div class="p-3 bg-white/5 rounded-lg text-center"><i class="ph-bold ph-paint-brush text-pink-400 text-xl"></i><div class="text-xs text-white mt-1">Designer</div></div>
                <div class="p-3 bg-white/5 rounded-lg text-center"><i class="ph-bold ph-code text-yellow-400 text-xl"></i><div class="text-xs text-white mt-1">FE + BE Dev</div></div>
                <div class="p-3 bg-white/5 rounded-lg text-center"><i class="ph-bold ph-chart-bar text-blue-400 text-xl"></i><div class="text-xs text-white mt-1">Data Analyst</div></div>
                <div class="p-3 bg-white/5 rounded-lg text-center"><i class="ph-bold ph-bug text-red-400 text-xl"></i><div class="text-xs text-white mt-1">QA</div></div>
            </div>
            <div class="p-4 bg-white/5 rounded-xl border border-white/10">
                <div class="text-white font-bold text-sm mb-3">Phase Plan</div>
                <div class="grid grid-cols-4 gap-2 text-xs">
                    <div class="p-2 bg-indigo-500/10 rounded text-center"><span class="text-indigo-400 font-bold">Week 1</span><br><span class="text-gray-300">Discovery + Offer + Tracking</span></div>
                    <div class="p-2 bg-cyan-500/10 rounded text-center"><span class="text-cyan-400 font-bold">Week 2</span><br><span class="text-gray-300">Portal MVP + Pilot</span></div>
                    <div class="p-2 bg-purple-500/10 rounded text-center"><span class="text-purple-400 font-bold">Week 3</span><br><span class="text-gray-300">Build + First Onboard</span></div>
                    <div class="p-2 bg-green-500/10 rounded text-center"><span class="text-green-400 font-bold">Week 4</span><br><span class="text-gray-300">Launch Engine + Reporting</span></div>
                </div>
            </div>`
        }
    ];

    function getSections7to12() {
        return sections7to12;
    }

    return { getSections7to12 };
})();

window.OutputContentLayer2B = OutputContentLayer2B;

// ===========================================
// OUTPUT CONTENT MODULE - Strategy Output Data
// Layers: 1 (One Pager), 2 (Build Pack), 3 (Appendix)
// ===========================================

const OutputContentModule = (function () {
    'use strict';

    // Layer 1: Executive Summary (One Pager)
    const layer1 = {
        title: "Executive Summary",
        icon: "ph-file-text",
        sections: [
            {
                id: "exec-problem",
                title: "The Problem (Plain Language)",
                icon: "ph-warning-circle",
                color: "red",
                content: `<p class="text-gray-300 leading-relaxed mb-4">A <strong class="text-white">Web2 and Web3 native, growth-focused marketing agency</strong> where AI isn't an "extra"—it's <strong class="text-white">the engine of the service</strong>. The goal: deliver <strong class="text-white">complete product launch strategy and execution</strong> for clients, ensuring everything is <strong class="text-white">measurable, scalable, and operationally robust</strong> (edge cases, error paths, recovery, compliance, brand safety).</p>`
            },
            {
                id: "exec-domain",
                title: "Domain & Risk Level",
                icon: "ph-target",
                color: "indigo",
                content: `
                <div class="space-y-4">
                    <div class="text-xs text-gray-400 uppercase tracking-wider mb-2">Top 3 Possible Domains</div>
                    <div class="space-y-2">
                        <div class="flex items-center justify-between p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                            <span class="text-white">MarTech + Professional Services (productized agency)</span>
                            <span class="text-indigo-400 font-bold">55%</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <span class="text-gray-300">Growth platform + Analytics (SaaS-like)</span>
                            <span class="text-purple-400 font-bold">30%</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                            <span class="text-gray-300">Web3 compliance-sensitive marketing & community</span>
                            <span class="text-cyan-400 font-bold">15%</span>
                        </div>
                    </div>
                    <div class="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <div class="flex items-center gap-2 text-yellow-400 text-xs font-bold mb-1">
                            <i class="ph-bold ph-warning"></i> RISK LEVEL
                        </div>
                        <p class="text-gray-300 text-sm">Medium-High (access management, ad platform policy, reputational damage, misleading messages, Web3 regulation, fraud/scam risk)</p>
                    </div>
                </div>`
            },
            {
                id: "exec-baseline",
                title: "Domain Baseline Pack",
                icon: "ph-brain",
                color: "purple",
                content: `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div class="text-xs text-purple-400 font-bold uppercase mb-2">Mental Models</div>
                        <ul class="space-y-2 text-sm text-gray-300">
                            <li>• Client expects "you handle it" but with transparency</li>
                            <li>• Web3 clients expect speed + narrative, higher trust/compliance risk</li>
                            <li>• Web2 clients view everything through pipeline, CAC, LTV, ROAS lens</li>
                        </ul>
                    </div>
                    <div class="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div class="text-xs text-cyan-400 font-bold uppercase mb-2">Standard Flows</div>
                        <ul class="space-y-2 text-sm text-gray-300">
                            <li>• Brief → Goals → Tracking → Channels → Creative → Launch → Optimize → Report</li>
                            <li>• Web3: Community, KOL, X, Discord, on-chain narrative, reputation</li>
                        </ul>
                    </div>
                    <div class="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div class="text-xs text-red-400 font-bold uppercase mb-2">Standard Failure Modes</div>
                        <ul class="space-y-2 text-sm text-gray-300">
                            <li>• Ad account ban, creative rejection, tracking errors, bad attribution</li>
                            <li>• Web3: Scam suspicion, impersonation, false claims, wallet fraud</li>
                        </ul>
                    </div>
                    <div class="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div class="text-xs text-green-400 font-bold uppercase mb-2">Typical KPIs</div>
                        <ul class="space-y-2 text-sm text-gray-300">
                            <li>• Time to First Value</li>
                            <li>• Qualified lead / signup / demo rate</li>
                            <li>• CAC, ROAS, payback, retention</li>
                            <li>• Delivery cycle time</li>
                        </ul>
                    </div>
                </div>`
            },
            {
                id: "exec-northstar",
                title: "North Star Metric",
                icon: "ph-star",
                color: "yellow",
                isHighlight: true,
                content: `
                <div class="text-center py-6">
                    <div class="hero-metric text-4xl md:text-5xl mb-4">Growth Win @ 30 Days</div>
                    <p class="text-gray-300 max-w-2xl mx-auto">"Number of clients who reach a predefined first Growth Win milestone within 30 days"</p>
                    <div class="mt-6 flex flex-wrap justify-center gap-3">
                        <span class="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-400">First 100 qualified leads</span>
                        <span class="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400">First 2,000 waitlist signups</span>
                        <span class="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-400">First $10k validated revenue</span>
                    </div>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
                    <div class="p-3 bg-white/5 rounded-lg text-center">
                        <div class="text-xs text-gray-400 mb-1">Lead to Call</div>
                        <div class="text-white font-bold">Conversion</div>
                    </div>
                    <div class="p-3 bg-white/5 rounded-lg text-center">
                        <div class="text-xs text-gray-400 mb-1">Onboarding</div>
                        <div class="text-white font-bold">Completion Rate</div>
                    </div>
                    <div class="p-3 bg-white/5 rounded-lg text-center">
                        <div class="text-xs text-gray-400 mb-1">Creative</div>
                        <div class="text-white font-bold">Throughput/wk</div>
                    </div>
                </div>`
            },
            {
                id: "exec-breakers",
                title: "Top 5 Breakers",
                icon: "ph-warning",
                color: "red",
                content: `
                <div class="space-y-3">
                    <div class="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <div class="w-8 h-8 flex items-center justify-center bg-red-500/20 rounded-lg text-red-400 font-bold">1</div>
                        <div class="flex-1">
                            <div class="text-white font-medium">Poorly Defined ICP & Offer</div>
                            <div class="text-xs text-gray-400">No repeatable growth without good marketing</div>
                        </div>
                        <span class="px-2 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-bold rounded">CRITICAL</span>
                    </div>
                    <div class="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <div class="w-8 h-8 flex items-center justify-center bg-red-500/20 rounded-lg text-red-400 font-bold">2</div>
                        <div class="flex-1">
                            <div class="text-white font-medium">Lack of Measurement</div>
                            <div class="text-xs text-gray-400">Without correct tracking, growth is just opinion</div>
                        </div>
                        <span class="px-2 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-bold rounded">CRITICAL</span>
                    </div>
                    <div class="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <div class="w-8 h-8 flex items-center justify-center bg-yellow-500/20 rounded-lg text-yellow-400 font-bold">3</div>
                        <div class="flex-1">
                            <div class="text-white font-medium">Platform Policy & Compliance</div>
                            <div class="text-xs text-gray-400">Crypto ads, permissions, MiCA requirements</div>
                        </div>
                        <span class="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[9px] font-bold rounded">HIGH</span>
                    </div>
                    <div class="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <div class="w-8 h-8 flex items-center justify-center bg-yellow-500/20 rounded-lg text-yellow-400 font-bold">4</div>
                        <div class="flex-1">
                            <div class="text-white font-medium">Ops Chaos</div>
                            <div class="text-xs text-gray-400">Deadlines slip, quality issues, support overload</div>
                        </div>
                        <span class="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[9px] font-bold rounded">HIGH</span>
                    </div>
                    <div class="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <div class="w-8 h-8 flex items-center justify-center bg-yellow-500/20 rounded-lg text-yellow-400 font-bold">5</div>
                        <div class="flex-1">
                            <div class="text-white font-medium">AI Reputation Risk</div>
                            <div class="text-xs text-gray-400">Inaccurate or aggressive copy, misleading claims</div>
                        </div>
                        <span class="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[9px] font-bold rounded">HIGH</span>
                    </div>
                </div>`
            }
        ]
    };

    // Layer 1 Plus: Buyer Summary
    const layer1Plus = {
        title: "Buyer Summary",
        subtitle: "What to Do Now (For Non-Experts)",
        icon: "ph-package",
        sections: [
            {
                id: "buyer-package",
                title: "What You Get",
                icon: "ph-gift",
                color: "green",
                content: `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
                        <div class="text-indigo-400 font-bold mb-2">Layer 1: One Pager</div>
                        <p class="text-sm text-gray-300">Executive summary. Open when you want to quickly understand: the plan, the goal, what happens in the first weeks, biggest risk and how we mitigate it.</p>
                    </div>
                    <div class="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/20">
                        <div class="text-cyan-400 font-bold mb-2">Layer 2: Build Pack</div>
                        <p class="text-sm text-gray-300">Step-by-step "how we do it": concrete onboarding process, screens & operations, rules, edge cases, what we do when things break.</p>
                    </div>
                    <div class="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                        <div class="text-purple-400 font-bold mb-2">Layer 3: Appendix</div>
                        <p class="text-sm text-gray-300">Evidence, measurement, math, audit. For when you need to debate a decision, calculate ROI, or audit that this is serious and buildable.</p>
                    </div>
                </div>`
            },
            {
                id: "buyer-timeline",
                title: "How to Proceed (Step by Step)",
                icon: "ph-list-checks",
                color: "cyan",
                content: `
                <div class="space-y-4">
                    <div class="flex gap-4 p-4 bg-white/5 rounded-xl border-l-4 border-indigo-500">
                        <div class="w-12 h-12 flex items-center justify-center bg-indigo-500/20 rounded-xl text-indigo-400 font-bold text-lg">1</div>
                        <div>
                            <div class="text-white font-bold">Day 1 — Context</div>
                            <ul class="text-sm text-gray-300 mt-2 space-y-1">
                                <li>• Read Layer 1</li>
                                <li>• Choose your "Growth Win" goal for 30 days (just one)</li>
                                <li>• Write in one sentence: who you serve and why now</li>
                            </ul>
                        </div>
                    </div>
                    <div class="flex gap-4 p-4 bg-white/5 rounded-xl border-l-4 border-cyan-500">
                        <div class="w-12 h-12 flex items-center justify-center bg-cyan-500/20 rounded-xl text-cyan-400 font-bold text-lg">2</div>
                        <div>
                            <div class="text-white font-bold">Day 2 — Measurement & Access</div>
                            <ul class="text-sm text-gray-300 mt-2 space-y-1">
                                <li>• Prepare access: analytics, website, ad accounts, CRM (if any)</li>
                                <li>• Check off the Build Pack checklist</li>
                                <li>• Web3: Only public wallet address + read-only analytics. <strong class="text-red-400">Never seed phrase, never private key</strong></li>
                            </ul>
                        </div>
                    </div>
                    <div class="flex gap-4 p-4 bg-white/5 rounded-xl border-l-4 border-purple-500">
                        <div class="w-12 h-12 flex items-center justify-center bg-purple-500/20 rounded-xl text-purple-400 font-bold text-lg">3</div>
                        <div>
                            <div class="text-white font-bold">Day 3 — Message & Offer</div>
                            <ul class="text-sm text-gray-300 mt-2 space-y-1">
                                <li>• Choose one main narrative from the provided messaging</li>
                                <li>• Decide your 3 package names and what they contain</li>
                                <li>• This goes on landing and outreach templates</li>
                            </ul>
                        </div>
                    </div>
                    <div class="flex gap-4 p-4 bg-white/5 rounded-xl border-l-4 border-green-500">
                        <div class="w-12 h-12 flex items-center justify-center bg-green-500/20 rounded-xl text-green-400 font-bold text-lg">4+</div>
                        <div>
                            <div class="text-white font-bold">Day 4+ — Launch Machine</div>
                            <p class="text-sm text-gray-300 mt-2">Every week same rhythm:</p>
                            <ul class="text-sm text-gray-300 mt-1 space-y-1">
                                <li>• <strong class="text-white">Monday:</strong> Focus & backlog decisions (top 2 priorities)</li>
                                <li>• <strong class="text-white">Tue-Thu:</strong> Production & campaigns</li>
                                <li>• <strong class="text-white">Friday:</strong> Report, learnings, next week's tests</li>
                            </ul>
                        </div>
                    </div>
                </div>`
            },
            {
                id: "buyer-data",
                title: "Understanding the Data",
                icon: "ph-chart-bar",
                color: "blue",
                content: `
                <div class="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 mb-4">
                    <p class="text-gray-300 text-sm">Every report shows 3 levels:</p>
                    <div class="grid grid-cols-3 gap-3 mt-3">
                        <div class="text-center p-2 bg-white/5 rounded-lg">
                            <div class="text-blue-400 font-bold text-xs">WHAT WE SEE</div>
                            <div class="text-gray-400 text-[10px]">Numbers, graphs</div>
                        </div>
                        <div class="text-center p-2 bg-white/5 rounded-lg">
                            <div class="text-purple-400 font-bold text-xs">WHY IT'S HAPPENING</div>
                            <div class="text-gray-400 text-[10px]">Hypothesis + uncertainty</div>
                        </div>
                        <div class="text-center p-2 bg-white/5 rounded-lg">
                            <div class="text-green-400 font-bold text-xs">WHAT TO DO</div>
                            <div class="text-gray-400 text-[10px]">Decision + risk</div>
                        </div>
                    </div>
                </div>
                <div class="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p class="text-sm text-gray-300"><strong class="text-yellow-400">When you see "assumption":</strong> It means there's no proof yet. Next to it you'll find how to validate it quickly and how long it takes.</p>
                </div>`
            },
            {
                id: "buyer-responsibilities",
                title: "Your Role vs. Our Role",
                icon: "ph-users",
                color: "purple",
                content: `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div class="text-purple-400 font-bold mb-3 flex items-center gap-2">
                            <i class="ph-bold ph-user"></i> YOU PROVIDE
                        </div>
                        <ul class="space-y-2 text-sm text-gray-300">
                            <li class="flex items-center gap-2"><i class="ph-bold ph-check text-green-400"></i> Goal priorities (one North Star)</li>
                            <li class="flex items-center gap-2"><i class="ph-bold ph-check text-green-400"></i> Approval for irreversible actions</li>
                            <li class="flex items-center gap-2"><i class="ph-bold ph-check text-green-400"></i> Access credentials</li>
                        </ul>
                    </div>
                    <div class="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div class="text-cyan-400 font-bold mb-3 flex items-center gap-2">
                            <i class="ph-bold ph-buildings"></i> WE PROVIDE
                        </div>
                        <ul class="space-y-2 text-sm text-gray-300">
                            <li class="flex items-center gap-2"><i class="ph-bold ph-check text-green-400"></i> Strategy, campaign plan, creative system</li>
                            <li class="flex items-center gap-2"><i class="ph-bold ph-check text-green-400"></i> Measurement, dashboard, experiment plan</li>
                            <li class="flex items-center gap-2"><i class="ph-bold ph-check text-green-400"></i> Error handling, policy compliance checks</li>
                            <li class="flex items-center gap-2"><i class="ph-bold ph-check text-green-400"></i> Weekly report and "next actions"</li>
                        </ul>
                    </div>
                </div>`
            }
        ]
    };

    // Public API
    function getLayer1() {
        return layer1;
    }

    function getLayer1Plus() {
        return layer1Plus;
    }

    function getAllLayers() {
        return {
            layer1,
            layer1Plus
        };
    }

    return {
        getLayer1,
        getLayer1Plus,
        getAllLayers
    };
})();

window.OutputContentModule = OutputContentModule;

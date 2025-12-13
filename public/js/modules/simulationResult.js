// SIMULATION DATA - Gemini 3 Master Prompt Result
// Topic: Webservice for Web2/Web3 Industries (Hybrid Gateway)

const SIMULATION_RESULT = {
    meta: {
        domain: "Enterprise Web3",
        risk: "Severe",
        confidence: 92,
        progress: 100,
        completedSectionCount: 17
    },

    // ============================================
    // 1. VP SUMMARY TAB
    // ============================================
    vp: {
        heroMetric: {
            value: "$12.5M",
            label: "Projected TVL (Total Value Locked)",
            trend: "+45% vs Competitors",
            trendUp: true
        },
        kpis: [
            { label: "Throughput", value: "50k", trend: "TPS / sec", trendUp: true, color: "green" },
            { label: "Gas Saved", value: "-40%", trend: "Per Tx", trendUp: true, color: "green" },
            { label: "Latency", value: "<150ms", trend: "E2E Finality", trendUp: true, color: "cyan" },
            { label: "Uptime", value: "99.99%", trend: "SLA Guaranteed", trendUp: true, color: "purple" }
        ],
        execSummary: `
            <p class="text-gray-300 leading-relaxed text-sm mb-4">
                The <strong class="text-white">Hybrid Nexus Gateway</strong> bridges the critical gap between legacy ISO 20022 banking standards and EVM-compatible liquidity pools. 
                By implementing a dual-layer consensus mechanism, enterprise clients can transact on public blockchains with 
                regulatory compliance guaranteed by a zero-knowledge proof oracle layer.
            </p>
            <p class="text-gray-300 leading-relaxed text-sm">
                This solution targets the \$2T cross-border payment market, offering instantaneous settlement with 40% lower fees 
                than traditional SWIFT rails, while maintaining strict KYC/AML adherence via Soulbound Identity Tokens.
            </p>
            <div class="mt-4 flex gap-2">
                <span class="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded border border-indigo-500/30">DeFi</span>
                <span class="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] rounded border border-cyan-500/30">Enterprise</span>
            </div>
        `,
        riskMatrix: [
            { id: 1, name: "Smart Contract Exploit", desc: "Re-entrancy vector in bridge liquidity pool", severity: "CRITICAL" },
            { id: 2, name: "Regulatory Shift", desc: "MiCA stablecoin classification changes", severity: "HIGH" },
            { id: 3, name: "Oracle Latency", desc: "Price feed deviation during volatility", severity: "HIGH" }
        ],
        solutionBullets: [
            "Dual-lock mechanism prevents bridge hacks",
            "ZK-Identity ensures GDPR-compliant transparency",
            "Gasless meta-transactions for Web2 UX",
            "Automated treasury rebalancing via AI agents"
        ],
        cost: {
            range: "$120k - $180k",
            timeline: "14-16 weeks",
            team: "Team of 8"
        }
    },

    // ============================================
    // 2. BUILD PACK TAB
    // ============================================
    build: {
        assumptions: [
            { id: 1, label: "EVM Compatibility", desc: "Target chains support Shanghai upgrade", type: "assumed", confidence: "95%" },
            { id: 2, label: "API Rate Limits", desc: "Banking partners provide 100 TPS", type: "in-scope", confidence: "100%" },
            { id: 3, label: "Layer 1 Settlement", desc: "Ethereum Mainnet for finality", type: "assumed", confidence: "90%" }
        ],
        screens: [
            {
                id: "SCREEN_01",
                title: "Gateway Dashboard",
                desc: "Real-time liquidity monitoring & API key management",
                components: "Sidebar, Chart.js, DataGrid",
                states: "Active, Paused, Emergency Stop",
                color: "indigo"
            },
            {
                id: "SCREEN_02",
                title: "Tx Builder",
                desc: "Low-code interface for constructing complex smart contract calls",
                components: "Drag-drop Canvas, JSON Viewer",
                states: "Draft, Validating, Signed",
                color: "cyan"
            },
            {
                id: "SCREEN_03",
                title: "Identity Vault",
                desc: "KYC/AML status management and ZK-proof generation",
                components: "FaceID Integration, File Upload",
                states: "Verifying, Verified, Rejected",
                color: "purple"
            }
        ],
        validation: [
            { field: "Destination Chain", rule: "EIP-155 Chain ID", timing: "Pre-flight", error: "Unsupported Network" },
            { field: "Liquidity Depth", rule: "Amount < Pool Reserve * 0.1", timing: "Execution", error: "High Slippage Warning" },
            { field: "Compliance Proof", rule: "Valid ZK-SNARK", timing: "On-chain", error: "Revert: Not Authorized" }
        ],
        techSpecs: `
            <div class="space-y-2">
                <div class="p-2 bg-black/30 rounded border border-white/10">
                    <div class="text-[10px] text-gray-500 mb-1">CORE STACK</div>
                    <div class="text-xs text-white font-mono">React, Node.js (NestJS), Solidity, Hardhat, The Graph</div>
                </div>
                <div class="p-2 bg-black/30 rounded border border-white/10">
                    <div class="text-[10px] text-gray-500 mb-1">INFRASTRUCTURE</div>
                    <div class="text-xs text-white font-mono">AWS Lambda, Alchemy RPC, IPFS (Metadata), Redis (Caching)</div>
                </div>
            </div>
        `
    },

    // ============================================
    // 3. EVIDENCE TAB
    // ============================================
    evidence: {
        decisions: [
            { item: "Hybrid Architecture", desc: "Off-chain order book, On-chain settlement", verdict: "APPROVED", impact: "High" },
            { item: "Rollup Choice", desc: "Optimism vs Arbitrum", verdict: "ARBITRUM ONE", impact: "Medium" }
        ],
        research: "Analyzed 12 competitor protocols (Uniswap, Aave, LayerZero). Identified gap in institutional-grade compliance wrappers for DeFi pools.",
        roi: {
            cost: "$150,000",
            revenue: "$4.2M / yr",
            breakEven: "4.5 Months",
            uplift: "28x"
        }
    }
};

window.SIMULATION_RESULT = SIMULATION_RESULT;

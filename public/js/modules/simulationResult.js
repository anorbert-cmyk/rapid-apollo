// SIMULATION DATA - Gemini 3 Master Prompt Result
// Topic: OrbitAI Growth (Agency Platform)

const SIMULATION_RESULT = {
    meta: {
        domain: "B2B Agency Platform",
        risk: "Medium-High",
        confidence: 88,
        progress: 100,
        completedSectionCount: 17
    },

    // ============================================
    // 1. VP SUMMARY TAB
    // ============================================
    vp: {
        heroMetric: {
            value: "28%",
            label: "Qualified Kickoff Rate",
            trend: "+120% vs Email Leads",
            trendUp: true
        },
        kpis: [
            { label: "Brief Completion", value: "65%", trend: "Wizard Format", trendUp: true, color: "green" },
            { label: "Compliance Pass", value: "92%", trend: "Web3 Gate", trendUp: true, color: "indigo" },
            { label: "Call Show-Up", value: "85%", trend: "Pre-paid Deposit", trendUp: false, color: "cyan" },
            { label: "Payback", value: "13mo", trend: "@ $90k Build", trendUp: true, color: "purple" }
        ],
        execSummary: `
            <p class="text-gray-300 leading-relaxed text-sm mb-4">
                <strong class="text-white">OrbitAI Growth</strong> is a productized agency platform designed to solve the credibility and compliance bottlenecks in Web3 marketing. 
                By replacing unstructured email threads with a <strong class="text-white">smart brief wizard</strong> and <strong class="text-white">automated compliance gating</strong>, 
                it qualifies high-value leads before human stratgey time is invested.
            </p>
            <p class="text-gray-300 leading-relaxed text-sm">
                The solution targets B2B SaaS and Crypto teams, filtering out regulatory risks (UK FCA, EU MiCA) upfront while reducing the cognitive load of onboarding by 40%.
            </p>
            <div class="mt-4 flex gap-2">
                <span class="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded border border-indigo-500/30">MarTech SaaS</span>
                <span class="px-2 py-0.5 bg-yellow-500/10 text-yellow-300 text-[10px] rounded border border-yellow-500/30">Regulated Promo</span>
            </div>
        `,
        riskMatrix: [
            { id: 1, name: "Web3 Compliance", desc: "Blocked ad accounts due to region mismatch", severity: "HIGH" },
            { id: 2, name: "Trust Deficit", desc: "Clients skepticism towards 'Agency' promises", severity: "MEDIUM" },
            { id: 3, name: "Form Abandonment", desc: "Brief wizard perceived as 'mentally expensive'", severity: "MEDIUM" }
        ],
        solutionBullets: [
            "Regional Compliance Gate (FCA/MiCA aligned)",
            "Progressive Disclosure Brief Wizard",
            "Transparent Project Portal & Approval Logs",
            "Productized Pricing (Sprints vs Retainers)"
        ],
        cost: {
            range: "$65k - $140k",
            timeline: "6 weeks (MVP)",
            team: "Team of 6-8"
        }
    },

    // ============================================
    // 2. BUILD PACK TAB
    // ============================================
    build: {
        assumptions: [
            { id: 1, label: "Productized Offers", desc: "Clients accept fixed packages over custom quotes", type: "validated", confidence: "Medium" },
            { id: 2, label: "Web3 Region Locks", desc: "Strict region gating prevents ad ban strikes", type: "in-scope", confidence: "High" },
            { id: 3, label: "Human Review", desc: "AI output requires human-in-the-loop for safety", type: "assumed", confidence: "High" }
        ],
        screens: [
            {
                id: "SCR_01",
                title: "Home & Routing",
                desc: "Credibility proof (Case Studies) and immediate Web2/Web3 segmentation.",
                components: "Hero, Trust Cards, Case Grids",
                states: "Default, Loading, Error",
                color: "indigo"
            },
            {
                id: "SCR_02",
                title: "Service Selection",
                desc: "Clear distinct tracks for Web2 Growth vs Web3 Compliance.",
                components: "Tab Navigation, Service Cards",
                states: "Active, Disabled (Gate)",
                color: "cyan"
            },
            {
                id: "SCR_04",
                title: "Pricing Packages",
                desc: "Launch Sprint vs Monthly Retainer with explicit inclusions.",
                components: "Pricing Cards, Comparison Rules",
                states: "Default, Selected",
                color: "green"
            },
            {
                id: "SCR_05",
                title: "Smart Brief Wizard",
                desc: "4-step progressive form: Basics -> Audience -> Compliance -> Budget.",
                components: "Stepper, Multi-Select, File Upload",
                states: "Step 1-4, Loading, Error",
                color: "purple"
            },
            {
                id: "SCR_06",
                title: "Compliance Gate",
                desc: "Blocking review step if user selects restricted regions (UK/EU) for Crypto.",
                components: "Warning Banner, Proof Upload",
                states: "Pass, Review Required",
                color: "red"
            },
            {
                id: "SCR_08",
                title: "Client Portal",
                desc: "Post-kickoff dashboard for deliverables, approvals, and reporting.",
                components: "Activity Stream, Approval Actions",
                states: "Empty, Active Project",
                color: "blue"
            }
        ],
        validation: [
            { field: "Business Email", rule: "Format & Domain Check", timing: "On Blur", error: "Please use work email" },
            { field: "Website URL", rule: "Reachable & Safe", timing: "Async Check", error: "Site not reachable" },
            { field: "Region Selection", rule: "Min 1 Region Required", timing: "On Submit", error: "Select target market" }
        ],
        deepDives: [
            {
                tag: "DEEP DIVE #1",
                tagColor: "red",
                label: "Critical Failure",
                title: "Web3 Eligibility Blocked",
                cause: "Crypto Promo in Regulated Region (UK) w/o Proof",
                copy: "Paid promotion in the UK needs an approved route. Switch to SEO?",
                recovery: "Alternative 'Safe Path' or Manual Review"
            },
            {
                tag: "DEEP DIVE #2",
                tagColor: "orange",
                label: "UX Resilience",
                title: "Brief Submit Timeout",
                cause: "Network drop during long form submission",
                copy: "We couldn't submit. Your answers are saved locally.",
                recovery: "Retry action + 'Copy Answers' backup"
            }
        ],
        techSpecs: `
            <div class="space-y-2">
                <div class="p-2 bg-black/30 rounded border border-white/10">
                    <div class="text-[10px] text-gray-500 mb-1">CORE APP</div>
                    <div class="text-xs text-white font-mono">Next.js 14 (App Router), React Hook Form, Tailwind CSS</div>
                </div>
                <div class="p-2 bg-black/30 rounded border border-white/10">
                    <div class="text-[10px] text-gray-500 mb-1">DATA & INFRA</div>
                    <div class="text-xs text-white font-mono">Supabase (Postgres), Redis (Rate Limits), S3 (Assets)</div>
                </div>
                <div class="p-2 bg-black/30 rounded border border-white/10">
                    <div class="text-[10px] text-gray-500 mb-1">INTEGRATIONS</div>
                    <div class="text-xs text-white font-mono">HubSpot CRM, SendGrid, OpenAI API (Drafts)</div>
                </div>
            </div>
        `
    },

    // ============================================
    // 3. EVIDENCE TAB
    // ============================================
    evidence: {
        decisions: [
            { item: "Brief Wizard Format", desc: "Multi-step vs Single Page", verdict: "APPROVED", impact: "High" },
            { item: "On-Blur Validation", desc: "Reduce premature error stress", verdict: "APPROVED", impact: "Medium" },
            { item: "Web3 Compliance Gate", desc: "Strict blocking vs Warning", verdict: "STRICT", impact: "High" }
        ],
        research: "User testing (n=8) showed 40% lower cognitive load with Wizard format. 'Smart Gate' increased trust for Web3 founders fearing bans.",
        roi: {
            cost: "$90,000",
            revenue: "$7.2k / mo",
            breakEven: "13 Months",
            uplift: "+25%"
        }
    }
};

window.SIMULATION_RESULT = SIMULATION_RESULT;

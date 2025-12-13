// SIMULATION DATA - Gemini 3 Master Prompt Result
// Topic: OrbitAI Growth (Agency Platform) - FULL VERSION

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
                it qualifies high-value leads before human strategy time is invested.
            </p>
            <p class="text-gray-300 leading-relaxed text-sm mb-4">
                The solution targets B2B SaaS and Crypto teams, filtering out regulatory risks (UK FCA, EU MiCA) upfront while reducing the cognitive load of onboarding by 40%.
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
                <span class="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded border border-indigo-500/30">MarTech SaaS</span>
                <span class="px-2 py-0.5 bg-yellow-500/10 text-yellow-300 text-[10px] rounded border border-yellow-500/30">Regulated Promo</span>
                <span class="px-2 py-0.5 bg-purple-500/10 text-purple-300 text-[10px] rounded border border-purple-500/30">Agency Model</span>
            </div>
        `,
        riskMatrix: [
            { id: 1, name: "Web3 Compliance", desc: "Blocked ad accounts due to region mismatch (UK FCA, EU MiCA)", severity: "HIGH" },
            { id: 2, name: "Trust Deficit", desc: "Client skepticism towards 'Agency' promises without proof", severity: "MEDIUM" },
            { id: 3, name: "Form Abandonment", desc: "Brief wizard perceived as 'mentally expensive' if too long", severity: "MEDIUM" },
            { id: 4, name: "Pricing Confusion", desc: "Sprint vs Retainer model unclear without explicit comparison", severity: "LOW" }
        ],
        solutionBullets: [
            "Regional Compliance Gate (FCA/MiCA aligned)",
            "Progressive Disclosure Brief Wizard (4 steps)",
            "Transparent Project Portal & Approval Logs",
            "Productized Pricing (Sprints vs Retainers)",
            "Human-in-the-loop AI Draft Review"
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
        // ASSUMPTION LEDGER - Detailed
        assumptions: [
            {
                id: 1,
                label: "Productized Offers Work",
                desc: "Clients will accept fixed packages (Sprint / Retainer) over custom quotes. Reduces negotiation overhead.",
                type: "validated",
                confidence: "85%",
                validation: "Customer interviews (n=12) showed 78% preference for clear pricing.",
                riskIfWrong: "Sales cycle elongates, custom scoping required."
            },
            {
                id: 2,
                label: "Web3 Region Locks Prevent Bans",
                desc: "Strict region gating (block UK/EU for unregistered crypto promo) reduces ad platform strikes.",
                type: "in-scope",
                confidence: "90%",
                validation: "Legal review + 3 case studies of banned accounts.",
                riskIfWrong: "Client accounts get banned, agency reputation damaged."
            },
            {
                id: 3,
                label: "AI Drafts Need Human Review",
                desc: "All AI-generated content passes through human editor before client sees it.",
                type: "assumed",
                confidence: "95%",
                validation: "Industry standard for regulated content.",
                riskIfWrong: "Compliance breach, legal exposure."
            },
            {
                id: 4,
                label: "Wizard Reduces Brief Quality Issues",
                desc: "Structured multi-step form captures better briefs than open-ended email.",
                type: "validated",
                confidence: "75%",
                validation: "A/B test planned for MVP.",
                riskIfWrong: "Same low-quality briefs, no efficiency gain."
            },
            {
                id: 5,
                label: "SMB Budgets Fit $3k-$10k Sprints",
                desc: "Target market (Series A-B startups) has budget for 1-3 month engagements.",
                type: "in-scope",
                confidence: "70%",
                validation: "Sales pipeline analysis from last 6 months.",
                riskIfWrong: "Need to go upmarket or reduce scope."
            }
        ],

        // SCOPE LOCK
        scopeLock: {
            inScope: [
                "Marketing Website (React/Next.js)",
                "Brief Wizard (4-step form)",
                "Client Portal (Deliverables, Approvals)",
                "Compliance Gate (Region + Proof Check)",
                "CRM Integration (HubSpot)",
                "Basic Analytics Dashboard"
            ],
            outOfScope: [
                "Mobile App",
                "Multi-currency Billing",
                "White-label for Agencies",
                "Real-time Chat Support",
                "Automated Ad Campaign Execution"
            ],
            phase2: [
                "AI Content Drafting (OpenAI)",
                "Advanced Reporting",
                "Slack Integration",
                "Custom Contract Templates"
            ]
        },

        // SCREEN SPECIFICATIONS - 8 Screens with Full Detail
        screens: [
            {
                id: "SCR_01",
                title: "Home & Routing",
                desc: "Credibility proof (Case Studies) and immediate Web2/Web3 segmentation. First impression matters.",
                components: "Hero Section, Trust Badges, Case Study Grid, CTA Buttons",
                states: "Default, Hover States, Mobile Collapsed",
                color: "indigo",
                wireframe: "Full-width hero with gradient overlay. Left: headline + subline + dual CTA. Right: floating 3D illustration or video loop.",
                interactions: "Scroll-triggered parallax on hero. Case study cards have hover lift effect.",
                copy: {
                    hero: "Growth that compounds. For Web2 & Web3.",
                    subline: "AI-powered marketing strategy meets regulatory compliance.",
                    cta1: "Get Started",
                    cta2: "See Case Studies"
                },
                microCopy: "Trusted by 50+ funded startups"
            },
            {
                id: "SCR_02",
                title: "Service Selection",
                desc: "Clear distinct tracks for Web2 Growth vs Web3 Compliance. Reduces confusion.",
                components: "Tab Navigation, Service Cards, Feature Comparison",
                states: "Active Tab, Disabled Tab (Gate), Hover",
                color: "cyan",
                wireframe: "Two large cards side-by-side. Left = Web2 (blue gradient), Right = Web3 (purple gradient). Each has bullet features.",
                interactions: "Tab switch with crossfade. Card click navigates to service detail.",
                copy: {
                    sectionTitle: "Choose Your Path",
                    web2Title: "Web2 Growth",
                    web2Desc: "SEO, Paid Ads, Content Marketing. No compliance friction.",
                    web3Title: "Web3 Compliant",
                    web3Desc: "Crypto-native campaigns with FCA/MiCA safeguards built in."
                },
                microCopy: "Can't decide? Talk to a strategist →"
            },
            {
                id: "SCR_03",
                title: "Case Studies Grid",
                desc: "Social proof page with filterable case studies by industry and service type.",
                components: "Filter Pills, Case Cards, Modal Lightbox",
                states: "Default Grid, Filtered, Empty State",
                color: "blue",
                wireframe: "3-column masonry grid. Each card: logo, metric highlight, category tag. Click opens modal with full story.",
                interactions: "Filter causes smooth reflow animation. Modal has dark overlay.",
                copy: {
                    sectionTitle: "Results That Speak",
                    emptyState: "No cases match your filter. Try broadening your search."
                },
                microCopy: "47 case studies and counting"
            },
            {
                id: "SCR_04",
                title: "Pricing Packages",
                desc: "Launch Sprint vs Monthly Retainer with explicit inclusions. Transparent.",
                components: "Pricing Cards, Feature Checklist, FAQ Accordion",
                states: "Default, Selected, Comparison Modal Open",
                color: "green",
                wireframe: "Two cards: Sprint ($5k one-time), Retainer ($3k/mo). Checklist of deliverables below each. CTA at bottom.",
                interactions: "Card hover lifts. 'Compare Plans' opens side-by-side modal.",
                copy: {
                    sprintTitle: "Launch Sprint",
                    sprintPrice: "$5,000",
                    sprintDesc: "One-time engagement. Strategy + 30-day execution.",
                    retainerTitle: "Monthly Retainer",
                    retainerPrice: "$3,000/mo",
                    retainerDesc: "Ongoing partnership. Minimum 3 months."
                },
                microCopy: "No hidden fees. Cancel anytime after minimum term."
            },
            {
                id: "SCR_05",
                title: "Smart Brief Wizard",
                desc: "4-step progressive form: Basics → Audience → Compliance → Budget. Reduces cognitive load.",
                components: "Progress Stepper, Form Fields, Multi-Select, File Upload, Summary Preview",
                states: "Step 1, Step 2, Step 3, Step 4, Validation Error, Loading, Success",
                color: "purple",
                wireframe: "Single-column centered form with step indicator at top. Each step has 3-5 fields max. Side panel shows summary.",
                interactions: "Step transitions slide left. Inline validation on blur. Summary updates live.",
                copy: {
                    step1Title: "Tell us about your company",
                    step2Title: "Who are you trying to reach?",
                    step3Title: "Compliance Check (Web3 only)",
                    step4Title: "Budget & Timeline",
                    successTitle: "Brief Submitted!"
                },
                microCopy: "Takes about 5 minutes. Your answers are auto-saved."
            },
            {
                id: "SCR_06",
                title: "Compliance Gate",
                desc: "Blocking review step if user selects restricted regions (UK/EU) for Crypto promotion.",
                components: "Warning Banner, Region Checklist, Proof Upload, Manual Review Request",
                states: "Pass (Green), Review Required (Orange), Blocked (Red)",
                color: "red",
                wireframe: "Full-width alert banner at top. Below: checklist of requirements. File upload for proof docs. CTA: 'Request Manual Review'.",
                interactions: "Banner color changes based on status. Upload shows progress bar. Success confetti.",
                copy: {
                    blockedTitle: "Promotional Restrictions Apply",
                    blockedDesc: "Paid crypto promotion in the UK requires FCA registration. You can proceed with organic content only, or upload proof of registration.",
                    passTitle: "You're Good to Go!",
                    passDesc: "No regional restrictions for your selected markets."
                },
                microCopy: "Unsure? Our compliance team can advise (free consultation)."
            },
            {
                id: "SCR_07",
                title: "Kickoff Confirmation",
                desc: "Post-submission confirmation with timeline and next steps.",
                components: "Success Animation, Timeline Preview, Calendar Link, Contact Card",
                states: "Loading, Success, Error Retry",
                color: "green",
                wireframe: "Centered card with checkmark animation. Below: 3-step timeline (Brief Review → Proposal → Kickoff). Calendar button.",
                interactions: "Confetti burst on success. Timeline steps animate in sequence.",
                copy: {
                    title: "Brief Received!",
                    subtitle: "Our team will review within 24 hours.",
                    step1: "Brief Review (24h)",
                    step2: "Proposal Sent (48h)",
                    step3: "Kickoff Call (Scheduled)"
                },
                microCopy: "Check your email for confirmation."
            },
            {
                id: "SCR_08",
                title: "Client Portal",
                desc: "Post-kickoff dashboard for deliverables, approvals, and reporting. The ongoing relationship hub.",
                components: "Activity Stream, Deliverable Cards, Approval Actions, Reporting Charts, Settings Tab",
                states: "Empty State, Active Project, Pending Approval, Completed",
                color: "blue",
                wireframe: "Two-column layout. Left: activity stream + notifications. Right: deliverable cards with status badges (Draft, Pending, Approved).",
                interactions: "Cards expand to show preview. Approve/Reject buttons with confirmation modal. Chart tooltips.",
                copy: {
                    emptyTitle: "No Active Projects Yet",
                    emptyDesc: "Submit a brief to get started.",
                    approvalTitle: "Review Required",
                    approvalDesc: "Your feedback is needed before we proceed."
                },
                microCopy: "Need help? Contact your dedicated strategist →"
            }
        ],

        // VALIDATION RULES
        validation: [
            { field: "Business Email", rule: "Format check + corporate domain required", timing: "On Blur", error: "Please use your work email (no gmail/yahoo)." },
            { field: "Website URL", rule: "Reachable (HTTP 200) + no malware flags", timing: "Async (2s debounce)", error: "We couldn't reach this site. Check the URL." },
            { field: "Region Selection", rule: "Min 1 region required. Web3 triggers compliance gate.", timing: "On Step Submit", error: "Select at least one target market." },
            { field: "Budget Range", rule: "Min $2,000 for project scope", timing: "On Change", error: "Minimum budget is $2,000 for our services." },
            { field: "Company Name", rule: "Required, 2-100 chars", timing: "On Blur", error: "Company name is required." },
            { field: "Phone (Optional)", rule: "E.164 format if provided", timing: "On Blur", error: "Please enter a valid phone number." }
        ],

        // DEEP DIVES - Error Scenarios
        deepDives: [
            {
                tag: "DEEP DIVE #1",
                tagColor: "red",
                label: "Critical Failure",
                title: "Web3 Eligibility Blocked",
                cause: "User selects UK as target region + crypto promotion without FCA registration proof.",
                copy: "Paid promotion targeting UK for crypto requires FCA registration. You can switch to organic content, target different regions, or upload proof of registration.",
                recovery: "Offer alternatives: (1) Switch to SEO/organic, (2) Remove UK from target, (3) Upload FCA docs for manual review."
            },
            {
                tag: "DEEP DIVE #2",
                tagColor: "orange",
                label: "UX Resilience",
                title: "Brief Submit Timeout",
                cause: "Network drop or server timeout during long form submission.",
                copy: "We couldn't submit your brief, but your answers are saved locally. Please try again.",
                recovery: "Auto-save enabled. Retry button. Option to 'Copy Answers' as backup text."
            },
            {
                tag: "DEEP DIVE #3",
                tagColor: "yellow",
                label: "Edge Case",
                title: "File Upload Failure",
                cause: "User uploads unsupported file type or file too large (>10MB).",
                copy: "This file type isn't supported. Please upload PDF, PNG, or JPG under 10MB.",
                recovery: "Show allowed formats. Compress option link. Alternative: 'Paste link instead'."
            }
        ],

        // TECH SPECS
        techSpecs: `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="p-3 bg-black/30 rounded-lg border border-white/10 h-full">
                    <div class="text-[10px] text-gray-500 mb-2 uppercase tracking-wide">FRONTEND</div>
                    <div class="text-xs text-white font-mono leading-relaxed">Next.js 14 (App Router), React Hook Form, Tailwind CSS, Framer Motion</div>
                </div>
                <div class="p-3 bg-black/30 rounded-lg border border-white/10 h-full">
                    <div class="text-[10px] text-gray-500 mb-2 uppercase tracking-wide">BACKEND & DATA</div>
                    <div class="text-xs text-white font-mono leading-relaxed">Supabase (Postgres + Auth), Redis (Rate Limits), S3 (Assets), Edge Functions</div>
                </div>
                <div class="p-3 bg-black/30 rounded-lg border border-white/10 h-full">
                    <div class="text-[10px] text-gray-500 mb-2 uppercase tracking-wide">INTEGRATIONS</div>
                    <div class="text-xs text-white font-mono leading-relaxed">HubSpot CRM, SendGrid (Email), Calendly (Booking), OpenAI (Drafts)</div>
                </div>
            </div>
        `,

        // UX BLUEPRINT
        uxBlueprint: {
            philosophy: "Progressive disclosure. Never overwhelm. Always guide.",
            principles: [
                "Form fields reveal as needed (conditional logic)",
                "Errors appear inline, not as modal interruption",
                "Success states are celebrated (confetti, animation)",
                "Empty states educate, not frustrate"
            ],
            accessibility: "WCAG 2.1 AA compliant. Keyboard navigable. Screen reader tested."
        }
    },

    // ============================================
    // 3. EVIDENCE TAB
    // ============================================
    evidence: {
        decisions: [
            { item: "Brief Wizard Format", desc: "Multi-step vs single page", verdict: "APPROVED", impact: "High", rationale: "User testing showed -40% cognitive load, +12% completion rate." },
            { item: "On-Blur Validation", desc: "Validate as user types vs on submit", verdict: "APPROVED", impact: "Medium", rationale: "Reduces form anxiety. Faster error recovery." },
            { item: "Web3 Compliance Gate", desc: "Strict blocking vs soft warning", verdict: "STRICT BLOCK", impact: "High", rationale: "Legal exposure too high. Must prevent non-compliant campaigns from starting." },
            { item: "Sprint vs Retainer Pricing", desc: "Single model vs dual model", verdict: "DUAL MODEL", impact: "Medium", rationale: "Covers both one-off and ongoing client needs. Tested with sales team." },
            { item: "AI Draft Review", desc: "Auto-publish vs human-in-loop", verdict: "HUMAN-IN-LOOP", impact: "High", rationale: "Regulated industry requires human oversight for all client-facing content." }
        ],
        research: `
            <div class="space-y-3">
                <div class="p-3 bg-white/5 rounded-lg border border-white/5">
                    <div class="text-[10px] text-indigo-400 uppercase tracking-wider mb-1">User Testing (n=8)</div>
                    <p class="text-xs text-gray-300">Wizard format reduced perceived effort by 40%. Users appreciated progress indicator. Drop-off at Compliance step needs work—considering inline help tooltips.</p>
                </div>
                <div class="p-3 bg-white/5 rounded-lg border border-white/5">
                    <div class="text-[10px] text-purple-400 uppercase tracking-wider mb-1">Competitor Analysis</div>
                    <p class="text-xs text-gray-300">3 of 5 competitors use long single-page forms. None have compliance gating. Differentiation opportunity confirmed.</p>
                </div>
                <div class="p-3 bg-white/5 rounded-lg border border-white/5">
                    <div class="text-[10px] text-cyan-400 uppercase tracking-wider mb-1">Sales Team Feedback</div>
                    <p class="text-xs text-gray-300">Sprint model preferred for new clients (lower commitment). Retainer upsell successful after first sprint in 60% of cases.</p>
                </div>
            </div>
        `,
        roi: {
            cost: "$90,000",
            revenue: "$7.2k / mo incremental",
            breakEven: "13 Months",
            uplift: "+25%",
            assumptions: "Based on 5 new qualified leads/week, 28% kickoff rate, $5k average deal size."
        }
    },

    // ============================================
    // 4. FIGMA AI PROMPT PACK (NEW)
    // ============================================
    figmaPrompts: {
        sectionTitle: "Figma AI Prompt Pack",
        description: "Copy-paste ready prompts for Figma AI or MidJourney to generate design assets.",
        prompts: [
            {
                id: "FIG_01",
                title: "Hero Section",
                prompt: "Create a modern SaaS hero section with dark gradient background (deep purple to black), floating 3D abstract shapes, bold sans-serif headline 'Growth that compounds', subline in lighter gray, and two CTA buttons (filled indigo, outlined white). Include subtle grid overlay and glow effects. Style: premium, minimal, tech-forward. 16:9 aspect ratio.",
                tags: ["Hero", "Landing", "Web Design"]
            },
            {
                id: "FIG_02",
                title: "Service Cards",
                prompt: "Design two side-by-side service cards for a marketing agency. Card 1: 'Web2 Growth' with blue gradient border, SEO/Ads icons. Card 2: 'Web3 Compliant' with purple gradient border, blockchain/shield icons. Dark background (#0a0a0f). Rounded corners (16px). Hover state shows subtle lift shadow. Include feature bullet points inside each card.",
                tags: ["Cards", "Services", "UI Components"]
            },
            {
                id: "FIG_03",
                title: "Multi-Step Form Wizard",
                prompt: "Design a 4-step form wizard for a B2B onboarding flow. Progress bar at top with numbered steps (1-4). Current step highlighted in indigo. Form fields: text input, dropdown, multi-select chips, file upload zone. Side panel shows live summary of entered data. Dark theme, glassmorphism card container. Mobile-first, centered layout. Include validation error states (red border + inline message).",
                tags: ["Form", "Wizard", "Onboarding"]
            },
            {
                id: "FIG_04",
                title: "Compliance Warning Banner",
                prompt: "Create a full-width warning banner for a compliance check screen. Gradient from orange to red. Icon: shield with exclamation mark. Headline: 'Promotional Restrictions Apply'. Body text explaining regional restrictions. Two CTAs: 'Upload Proof' (filled), 'Change Regions' (outlined). Dark page background. Should feel serious but not alarming.",
                tags: ["Alert", "Compliance", "Banner"]
            },
            {
                id: "FIG_05",
                title: "Client Portal Dashboard",
                prompt: "Design a client portal dashboard for a marketing agency. Two-column layout on desktop. Left: activity feed with timestamped entries (icon + text + time). Right: project cards showing deliverables with status badges (Draft: yellow, Pending: blue, Approved: green). Action buttons: Approve, Request Changes. Dark theme with subtle card shadows. Include empty state for 'No active projects'.",
                tags: ["Dashboard", "Portal", "Client"]
            },
            {
                id: "FIG_06",
                title: "Pricing Comparison",
                prompt: "Create a pricing section with two plan cards: 'Launch Sprint' ($5,000 one-time) and 'Monthly Retainer' ($3,000/mo). Each card has: price, description, feature checklist with checkmarks, CTA button. Highlight recommended plan with 'Popular' badge. Dark background, cards have subtle gradient borders. Include 'Compare Plans' link that opens modal. Add money-back guarantee badge.",
                tags: ["Pricing", "Cards", "Comparison"]
            },
            {
                id: "FIG_07",
                title: "Success Confirmation",
                prompt: "Design a success confirmation screen after form submission. Centered layout. Large animated checkmark in green circle. Headline: 'Brief Received!'. Subline: 'Our team will review within 24 hours.' Below: 3-step horizontal timeline (Brief Review → Proposal → Kickoff) with icons. 'Add to Calendar' button. Confetti burst animation. Dark background.",
                tags: ["Success", "Confirmation", "Animation"]
            },
            {
                id: "FIG_08",
                title: "Mobile Navigation",
                prompt: "Design a mobile bottom navigation bar for an agency platform. 5 items: Home, Services, Pricing, Portal, Contact. Active state: indigo icon + dot indicator above. Inactive: gray icons. Frosted glass background effect. Rounded corners (24px). Safe area padding for iPhone notch. Include subtle shadow.",
                tags: ["Mobile", "Navigation", "UI"]
            }
        ]
    }
};

window.SIMULATION_RESULT = SIMULATION_RESULT;

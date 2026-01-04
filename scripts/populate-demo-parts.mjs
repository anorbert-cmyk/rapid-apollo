import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DEMO_SESSION_ID = 'test-apex-demo-LAIdJqey';

// Part 5: 5 Advanced Design Prompts (Edge Cases, Error States, Mobile)
const PART5_CONTENT = `# PART 5 – 5 Advanced Design Prompts

## Edge Cases, Error States & Mobile Adaptations

These 5 advanced prompts handle the critical edge cases that separate amateur designs from production-ready interfaces.

---

### Prompt 6: Empty State - No Analyses Yet

**Screen:** Dashboard Empty State  
**Context:** First-time user with no purchased analyses

\`\`\`
Design an empty state for a SaaS dashboard when the user has no data yet.

LAYOUT:
- Centered content area with max-width 480px
- Large illustration or icon (120x120px) at top
- Headline: "Your Strategic Journey Starts Here"
- Subtext explaining the value proposition
- Primary CTA button: "Get Your First Analysis"
- Secondary link: "Watch Demo" or "Learn More"

VISUAL STYLE:
- Soft gradient background (purple-500/5 to cyan-500/5)
- Illustration style: Abstract geometric shapes, not cartoon characters
- Use brand colors for accent elements
- Subtle animated dots or particles in background

MICRO-INTERACTIONS:
- CTA button has subtle pulse animation
- Illustration elements float gently
- Hover state on CTA shows arrow sliding right

COPY TONE:
- Encouraging, not condescending
- Focus on outcome ("strategic clarity") not feature ("AI analysis")
\`\`\`

---

### Prompt 7: Error State - Payment Failed

**Screen:** Checkout Error Modal  
**Context:** Payment declined or processing error

\`\`\`
Design an error modal for failed payment in a premium SaaS checkout flow.

LAYOUT:
- Modal overlay with backdrop blur
- Modal width: 420px max
- Error icon at top (not generic red X)
- Clear error headline
- Specific error message with actionable guidance
- Two buttons: "Try Again" (primary) and "Use Different Method" (secondary)
- Small link: "Contact Support"

VISUAL STYLE:
- Error icon: Animated credit card with subtle shake
- Use amber/orange for warning, not aggressive red
- Card background: dark with subtle red-500/10 tint
- Border: 1px solid red-500/30

ERROR MESSAGES (contextual):
- Card declined: "Your card was declined. Please check your details or try a different card."
- Insufficient funds: "Payment couldn't be processed. Your bank may have more details."
- Network error: "Connection interrupted. Your card was not charged. Please try again."

ACCESSIBILITY:
- Error announced to screen readers
- Focus trapped in modal
- Escape key closes modal
- Error icon has aria-label
\`\`\`

---

### Prompt 8: Loading State - Analysis Generation

**Screen:** Analysis Processing View  
**Context:** User waiting for 6-part analysis to generate (2-5 minutes)

\`\`\`
Design a loading/progress view for a multi-step AI analysis generation.

LAYOUT:
- Full-page takeover (no navigation distractions)
- Centered progress indicator
- 6-step progress tracker (horizontal or vertical)
- Current step highlighted with animation
- Estimated time remaining
- "What's happening" explanation text
- Cancel button (with confirmation)

PROGRESS TRACKER:
- 6 steps: Discovery → Competitors → Roadmap → Core Prompts → Advanced Prompts → Risk Analysis
- Completed steps: checkmark icon, green accent
- Current step: pulsing dot, primary color
- Pending steps: muted circle, gray

ANIMATIONS:
- Smooth progress bar fill
- Step icons animate on completion
- Subtle particle effects around current step
- Text content fades between step descriptions

ENGAGEMENT FEATURES:
- Show preview snippets as each part completes
- "Did you know?" tips rotating every 15 seconds
- Progress percentage and ETA updating in real-time

MOBILE:
- Vertical step tracker
- Sticky progress bar at top
- Collapsible "What's happening" section
\`\`\`

---

### Prompt 9: Mobile Navigation - Responsive Sidebar

**Screen:** Mobile Dashboard Navigation  
**Context:** Converting desktop sidebar to mobile-friendly navigation

\`\`\`
Design a mobile navigation pattern for a dashboard with 5+ menu items.

PATTERN: Bottom sheet navigation (not hamburger menu)

LAYOUT:
- Fixed bottom bar with 4 primary actions + "More" overflow
- "More" opens bottom sheet with full menu
- Bottom sheet has drag handle for dismiss
- Active item highlighted with pill background

BOTTOM BAR ITEMS:
1. Home (dashboard icon)
2. Analyses (document icon)
3. New (plus icon, primary color)
4. History (clock icon)
5. More (dots icon)

BOTTOM SHEET:
- Slides up from bottom with spring animation
- Semi-transparent backdrop
- Grouped menu items with section headers
- User profile at top with avatar and email
- Logout at bottom with red accent

GESTURES:
- Swipe down to dismiss bottom sheet
- Long press on bottom bar item shows tooltip
- Haptic feedback on item selection

SAFE AREAS:
- Respect iOS safe area insets
- Bottom bar height: 64px + safe area
- Touch targets: minimum 44x44px
\`\`\`

---

### Prompt 10: Confirmation Modal - Delete Analysis

**Screen:** Destructive Action Confirmation  
**Context:** User attempting to delete a purchased analysis

\`\`\`
Design a confirmation modal for irreversible destructive action.

LAYOUT:
- Modal width: 380px
- Warning icon (not generic)
- Clear headline stating the action
- Explanation of consequences
- Checkbox: "I understand this cannot be undone"
- Two buttons: "Cancel" (secondary) and "Delete" (destructive)

VISUAL HIERARCHY:
- Warning icon: Large (48px), amber/red gradient
- Headline: Bold, 18px
- Consequences: Regular weight, muted color, bullet points
- Checkbox: Must be checked to enable delete button
- Delete button: Red background, disabled until checkbox checked

COPY:
- Headline: "Delete 'Web3 Marketing Agency' Analysis?"
- Consequences:
  • All 6 parts will be permanently removed
  • This action cannot be undone
  • You will not receive a refund
- Checkbox label: "I understand this will permanently delete my analysis"

ANIMATIONS:
- Modal scales in from 95% to 100%
- Delete button enables with subtle color transition
- Shake animation if user clicks disabled delete button

ACCESSIBILITY:
- Focus starts on Cancel button (safe default)
- Escape key triggers Cancel
- Delete button has aria-describedby pointing to consequences
\`\`\`

---

## Implementation Notes

These 5 advanced prompts cover the critical UX scenarios that are often overlooked:

1. **Empty States** - First impressions matter; guide users to value
2. **Error States** - Reduce anxiety; provide clear recovery paths
3. **Loading States** - Transform wait time into engagement
4. **Mobile Navigation** - Thumb-friendly patterns for on-the-go users
5. **Destructive Actions** - Prevent accidents; build trust through friction

Each prompt includes specific measurements, animations, and accessibility requirements to ensure production-ready output.
`;

// Part 6: Risk, Metrics & ROI
const PART6_CONTENT = `# PART 6 – Risk Assessment, Success Metrics & ROI Justification

## Executive Risk Summary

Launching a global Web2/Web3 marketing agency carries **moderate-high risk** with **high reward potential**. The primary risks center on regulatory compliance (FTC/SEC), market timing for Web3 adoption, and operational scaling challenges. Mitigation strategies focus on compliance-first positioning, diversified revenue streams, and AI-augmented service delivery.

---

## Risk Matrix

| Risk Category | Probability | Impact | Risk Score | Mitigation Strategy |
|--------------|-------------|--------|------------|---------------------|
| Regulatory (FTC/SEC) | High (70%) | Critical | 🔴 **9/10** | Pre-publication compliance review, legal counsel on retainer, automated disclosure verification |
| Market Timing (Web3) | Medium (50%) | High | 🟠 **7/10** | Dual-market positioning (Web2 fallback), flexible pricing tiers, pivot-ready service architecture |
| Competitive Pressure | High (65%) | Medium | 🟠 **6/10** | Differentiation through on-chain verification, transparent pricing, compliance expertise |
| Operational Scaling | Medium (45%) | High | 🟡 **5/10** | AI-augmented workflows, standardized playbooks, contractor network |
| Client Acquisition | Medium (55%) | High | 🟠 **6/10** | Content marketing, referral incentives, strategic partnerships |
| Cash Flow | Medium (40%) | Critical | 🟡 **5/10** | Retainer-based pricing, milestone payments, 50% upfront for new clients |

---

## Detailed Risk Analysis

### 1. Regulatory Compliance Risk 🔴

**The Threat:**
- FTC requires clear disclosure for all paid endorsements and influencer campaigns
- SEC scrutiny on token-related marketing (potential securities violations)
- GDPR/CCPA compliance for data handling across jurisdictions
- Platform-specific rules (Twitter, YouTube, TikTok) constantly evolving

**Probability Assessment:** 70% chance of encountering compliance issues in first 12 months without proper systems

**Impact if Realized:**
- FTC fines: $10,000 - $50,000 per violation
- SEC enforcement: Potential criminal liability for token promotions
- Reputation damage: Loss of client trust, negative press
- Operational disruption: 2-4 weeks to remediate

**Mitigation Strategies:**
1. **Compliance-First Positioning:** Market compliance expertise as core differentiator
2. **Legal Infrastructure:** Retain crypto-specialized legal counsel ($5,000/month budget)
3. **Automated Verification:** Build disclosure verification into campaign workflows
4. **Client Education:** Mandatory compliance training for all Web3 clients
5. **Insurance:** Errors & omissions coverage ($1M minimum)

**Residual Risk After Mitigation:** Medium (35%)

---

### 2. Market Timing Risk 🟠

**The Threat:**
- Web3 market volatility affects client budgets
- Regulatory crackdowns could freeze Web3 marketing spend
- Web2 market is mature with established competitors

**Probability Assessment:** 50% chance of significant market shift in 12 months

**Mitigation Strategies:**
1. **Dual Revenue Streams:** Maintain 50/50 Web2/Web3 client split
2. **Flexible Contracts:** Month-to-month options for volatile markets
3. **Pivot-Ready Services:** Core skills transfer between Web2 and Web3
4. **Cash Reserves:** 6-month runway minimum

**Residual Risk After Mitigation:** Low-Medium (30%)

---

## Success Metrics Framework

### Tier 1: Business Health Metrics (Monthly Review)

| Metric | Target (Month 6) | Target (Month 12) | Measurement Method |
|--------|-----------------|-------------------|-------------------|
| Monthly Recurring Revenue (MRR) | $25,000 | $50,000 | Stripe/Payment dashboard |
| Active Clients | 8 | 20 | CRM count |
| Client Retention Rate | 85% | 90% | Cohort analysis |
| Average Revenue Per Client | $3,125 | $2,500 | MRR / Active clients |
| Cash Runway | 6 months | 9 months | Bank balance / burn rate |

### Tier 2: Operational Metrics (Weekly Review)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Lead Response Time | < 2 hours | CRM timestamp |
| Proposal-to-Close Rate | 35% | Pipeline tracking |
| Campaign Launch Time | < 5 days | Project management |
| Client NPS Score | > 50 | Quarterly surveys |
| Support Ticket Resolution | < 24 hours | Help desk metrics |

### Tier 3: Growth Metrics (Quarterly Review)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Organic Traffic Growth | 20% QoQ | Google Analytics |
| Referral Revenue % | 30% | Attribution tracking |
| Content Engagement | 5% CTR | Email/social analytics |
| Brand Mentions | 50/month | Social listening |

---

## ROI Justification Model

### Investment Requirements (12 Months)

| Category | Amount | Notes |
|----------|--------|-------|
| Legal & Compliance | $60,000 | Counsel retainer, insurance, licenses |
| Technology Stack | $24,000 | CRM, project management, AI tools |
| Marketing & Content | $36,000 | Website, content production, ads |
| Contractor Network | $48,000 | Designers, copywriters, specialists |
| Operations | $24,000 | Admin, accounting, misc |
| **Total Investment** | **$192,000** | |

### Revenue Projections (12 Months)

| Quarter | New Clients | MRR (End) | Quarterly Revenue |
|---------|-------------|-----------|-------------------|
| Q1 | 5 | $15,000 | $27,000 |
| Q2 | 5 | $30,000 | $67,500 |
| Q3 | 5 | $42,000 | $108,000 |
| Q4 | 5 | $50,000 | $138,000 |
| **Year 1 Total** | **20** | **$50,000** | **$340,500** |

### ROI Calculation

\`\`\`
Year 1 Revenue:        $340,500
Year 1 Investment:     $192,000
Year 1 Profit:         $148,500
ROI:                   77.3%
Payback Period:        6.8 months
\`\`\`

### Sensitivity Analysis

| Scenario | Revenue | Profit | ROI |
|----------|---------|--------|-----|
| **Optimistic** (+20% clients) | $408,600 | $216,600 | 112.8% |
| **Base Case** | $340,500 | $148,500 | 77.3% |
| **Conservative** (-20% clients) | $272,400 | $80,400 | 41.9% |
| **Pessimistic** (-40% clients) | $204,300 | $12,300 | 6.4% |

---

## Decision Framework

### Go/No-Go Criteria

✅ **Proceed if:**
- Minimum 3 signed LOIs from potential clients
- Legal structure and compliance framework in place
- 6-month cash runway secured
- Core team (founder + 1-2 contractors) committed

⚠️ **Pause if:**
- Regulatory environment significantly worsens
- Unable to secure initial clients within 60 days
- Cash runway drops below 3 months
- Key team member departure

❌ **Abort if:**
- SEC enforcement action against similar agencies
- Personal liability exposure identified
- Market conditions make Web3 services unviable
- Unable to achieve break-even within 18 months

---

## Conclusion

The Web2/Web3 marketing agency opportunity presents a **favorable risk-reward profile** with:

- **77.3% projected ROI** in Year 1
- **6.8-month payback period**
- **Diversified revenue** reducing market timing risk
- **Compliance differentiation** creating competitive moat

**Recommendation:** Proceed with launch, prioritizing compliance infrastructure and dual-market positioning. Monitor regulatory developments closely and maintain pivot flexibility.
`;

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Update the demo analysis with Part 5 and Part 6
    const [result] = await connection.execute(
      'UPDATE analysis_results SET part5 = ?, part6 = ? WHERE sessionId = ?',
      [PART5_CONTENT, PART6_CONTENT, DEMO_SESSION_ID]
    );
    
    console.log('Updated demo analysis:', result);
    
    // Verify the update
    const [verify] = await connection.execute(
      'SELECT sessionId, LENGTH(part5) as p5_len, LENGTH(part6) as p6_len FROM analysis_results WHERE sessionId = ?',
      [DEMO_SESSION_ID]
    );
    
    console.log('Verification:', verify);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

main();

// ===========================================
// SOLUTION RESPONSE TYPES
// Structured output for tier-specific AI analysis
// ===========================================

/**
 * Metadata about the analysis request
 */
export interface SolutionMeta {
    /** Original problem statement from user */
    originalProblem: string;
    /** Tier level: standard, medium, full */
    tier: 'standard' | 'medium' | 'full';
    /** AI provider used */
    provider: 'gemini' | 'openai' | 'openai-o1' | 'openai-gpt4o' | 'openai-gpt5' | 'openai-o3' | 'perplexity-sonar' | 'perplexity-sonar-multipart';
    /** Timestamp of generation */
    generatedAt: number;
    /** Transaction hash for verification */
    txHash?: string;
    /** Whether this is a multi-part analysis */
    isMultiPart?: boolean;
}

/**
 * STANDARD tier sections
 * Quick, actionable insights
 */
export interface StandardSections {
    /** Executive summary - 2-3 sentences */
    executiveSummary: string;
    /** Key insight or recommendation */
    keyInsight: string;
    /** Next step to take */
    nextStep: string;
}

/**
 * MEDIUM tier sections (includes Standard)
 * Detailed analysis with structured breakdown
 */
export interface MediumSections extends StandardSections {
    /** Problem analysis breakdown */
    problemAnalysis: {
        /** Core problem identified */
        coreProblem: string;
        /** Root causes */
        rootCauses: string[];
        /** Impact areas */
        impactAreas: string[];
    };
    /** Strategic recommendations */
    strategicRecommendations: {
        /** Immediate actions (24h) */
        immediate: string[];
        /** Short-term actions (1 week) */
        shortTerm: string[];
        /** Long-term considerations */
        longTerm: string[];
    };
    /** Risk assessment */
    riskAssessment: {
        /** Main risks */
        risks: string[];
        /** Mitigation strategies */
        mitigations: string[];
    };
}

/**
 * FULL tier sections (includes Medium)
 * PhD-level deep dive with multi-perspective analysis
 */
export interface FullSections extends MediumSections {
    /** Theoretical framework */
    theoreticalFramework: {
        /** Applicable theories/models */
        frameworks: string[];
        /** How they apply */
        application: string;
    };
    /** Multi-stakeholder perspective */
    stakeholderAnalysis: {
        stakeholder: string;
        perspective: string;
        concerns: string[];
    }[];
    /** Competitive/market context */
    marketContext: {
        /** Industry trends */
        trends: string[];
        /** Competitive landscape */
        competitiveLandscape: string;
        /** Opportunity identification */
        opportunities: string[];
    };
    /** Projected outcomes */
    projectedOutcomes: {
        /** Success metrics */
        metrics: {
            name: string;
            currentValue?: string;
            targetValue: string;
            timeframe: string;
        }[];
        /** Expected ROI or impact */
        expectedImpact: string;
        /** Confidence level (0-100) */
        confidence: number;
    };
    /** Implementation roadmap */
    implementationRoadmap: {
        phase: string;
        duration: string;
        keyActivities: string[];
        deliverables: string[];
    }[];
}

/**
 * Multi-part sections (for 4-part streaming analysis)
 * Used for full tier with sequential AI generation
 */
export interface MultiPartSections extends StandardSections {
    /** Part 1: Discovery & Problem Analysis */
    part1?: string;
    /** Part 2: Strategic Design & Roadmap */
    part2?: string;
    /** Part 3: AI Toolkit & Figma Prompts */
    part3?: string;
    /** Part 4: Risk, Metrics & Rationale */
    part4?: string;
}

/**
 * Complete solution response
 * Type varies by tier
 */
export type SolutionSections = StandardSections | MediumSections | FullSections | MultiPartSections;

export interface SolutionResponse {
    /** Response metadata */
    meta: SolutionMeta;
    /** Tier-specific sections */
    sections: SolutionSections;
    /** Raw markdown (for backward compatibility) */
    rawMarkdown?: string;
}

/**
 * Type guard for Medium tier
 */
export function isMediumTier(sections: SolutionSections): sections is MediumSections {
    return 'problemAnalysis' in sections;
}

/**
 * Type guard for Full tier
 */
export function isFullTier(sections: SolutionSections): sections is FullSections {
    return 'theoreticalFramework' in sections;
}

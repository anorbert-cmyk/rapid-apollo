// ===========================================
// REPORT TYPES - Perplexity Report Generation
// ===========================================

/**
 * Report Status enum
 */
export type ReportStatus =
    | 'queued'
    | 'analysis'
    | 'validation'
    | 'figma'
    | 'completed'
    | 'failed';

/**
 * Report Package types
 */
export type ReportPackage = 'premium' | 'premium_figma';

/**
 * Job data for BullMQ queue
 */
export interface ReportJobData {
    reportId: string;
    walletAddress: string;
    problemStatement: string;
    package: ReportPackage;
    userContext?: {
        location?: string;
        language?: string;
        industry?: string;
    };
}

/**
 * Perplexity API usage tracking
 */
export interface PerplexityUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    searchCount?: number;
    estimatedCost: number;
    model: string;
    processingTimeMs: number;
}

/**
 * Parsed sections from the masterprompt output
 * Maps to the 18 sections defined in the masterprompt
 */
export interface ParsedSections {
    section0_executiveSummary?: string;
    section0_operatorGuide?: string;
    section1_assumptionLedger?: string;
    section2_productStrategy?: string;
    section3_researchPlan?: string;
    section4_uxBlueprint?: string;
    section5_screenSpecs?: string;
    section6_validationRules?: string;
    section7_validationRationale?: string;
    section8_resilienceMap?: string;
    section9_designAudit?: string;
    section10_implementationSpecs?: string;
    section11_technicalPlan?: string;
    section12_teamDelivery?: string;
    section13_costModel?: string;
    section14_businessCase?: string;
    section15_evidenceTable?: string;
    section16_figmaPrompts?: string;
    section17_figmaQA?: string;
    section18_verificationGate?: string;
}

/**
 * Figma prompt pack
 */
export interface FigmaPrompts {
    promptA_happyPath?: string;
    promptB_errorRecovery?: string;
    promptC_componentLibrary?: string;
    prompt0_foundations?: string;
    additionalPrompts?: string[];
}

/**
 * Section validation result
 */
export interface SectionValidation {
    sectionId: string;
    found: boolean;
    lineStart?: number;
    lineEnd?: number;
    wordCount?: number;
}

/**
 * Complete validation result
 */
export interface ValidationResult {
    isComplete: boolean;
    totalSections: number;
    foundSections: number;
    missingSections: string[];
    sections: SectionValidation[];
    warnings: string[];
}

/**
 * Stored report in database
 */
export interface StoredReport {
    id: string;
    walletAddress: string;
    problemStatement: string;
    package: ReportPackage;
    status: ReportStatus;
    progress: number;

    // Content
    analysisMarkdown?: string;
    figmaPrompts?: FigmaPrompts;
    parsedSections?: ParsedSections;

    // Metadata
    perplexityUsage?: PerplexityUsage;
    processingTimeMs?: number;
    errorMessage?: string;

    // Payment
    txHash?: string;
    stripeSessionId?: string;

    // Timestamps
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}

/**
 * Report API response
 */
export interface ReportResponse {
    id: string;
    status: ReportStatus;
    progress: number;
    estimatedTimeRemaining?: string;

    // Only present when completed
    analysisMarkdown?: string;
    parsedSections?: ParsedSections;
    figmaPrompts?: FigmaPrompts;

    // Metadata
    package: ReportPackage;
    createdAt: string;
    completedAt?: string;
    processingTimeMs?: number;
}

/**
 * Report generation request
 */
export interface GenerateReportRequest {
    problemStatement: string;
    package: ReportPackage;
    walletAddress: string;
    signature: string;
    timestamp: number;
    txHash?: string;
    stripeSessionId?: string;
}

/**
 * Report generation response
 */
export interface GenerateReportResponse {
    success: boolean;
    reportId: string;
    status: ReportStatus;
    statusUrl: string;
    estimatedTime: string;
}

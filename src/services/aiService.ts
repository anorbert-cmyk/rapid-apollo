import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { logger } from '../utils/logger';
import { getMasterPrompt } from '../prompts/masterPrompts';
import {
    SolutionResponse,
    SolutionSections,
    StandardSections,
    MediumSections,
    FullSections
} from '../types/solution';

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

// ===========================================
// PROMPT INJECTION DEFENSE
// ===========================================

const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|rules?|prompts?)/gi,
    /disregard\s+(all\s+)?(previous|above|prior)/gi,
    /forget\s+(everything|all|your)\s+(instructions?|rules?|training)/gi,
    /you\s+are\s+(now|actually|really)\s+(?!analyzing|helping)/gi,
    /act\s+as\s+(?!a\s+helpful)/gi,
    /pretend\s+(to\s+be|you('re)?)/gi,
    /roleplay\s+as/gi,
    /switch\s+to\s+.*\s+mode/gi,
    /what\s+(are|is)\s+your\s+(system\s+)?prompt/gi,
    /show\s+(me\s+)?your\s+(instructions?|prompt|rules)/gi,
    /reveal\s+(your\s+)?(hidden\s+)?instructions?/gi,
    /DAN\s*mode/gi,
    /developer\s+mode/gi,
    /sudo\s+mode/gi,
    /\[JAILBREAK\]/gi,
    /bypass\s+(safety|filter|restriction)/gi,
    /<script[\s>]/gi,
];

function sanitizeInput(input: string): { sanitized: string; flags: string[] } {
    const flags: string[] = [];
    let sanitized = input;

    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(input)) {
            flags.push(`Pattern: ${pattern.source.slice(0, 20)}...`);
        }
        pattern.lastIndex = 0;
    }

    // Escape delimiters
    sanitized = sanitized
        .replace(/</g, '＜')
        .replace(/>/g, '＞')
        .replace(/\[/g, '［')
        .replace(/\]/g, '］');

    // Remove control characters (intentional security measure)
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return { sanitized, flags };
}

// ===========================================
// JSON PARSING HELPERS
// ===========================================

/**
 * Extract JSON from potentially messy AI response
 */
function extractJSON(text: string): string {
    // Try to find JSON block
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return jsonMatch[0];
    }

    // If starts with ``` remove markdown code block
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
        return codeBlockMatch[1].trim();
    }

    return text;
}

/**
 * Validate and parse JSON response for a tier
 */
function parseAndValidateResponse(jsonText: string, tier: string): SolutionSections {
    try {
        const parsed = JSON.parse(jsonText);

        // Validate required fields for all tiers
        if (!parsed.executiveSummary || !parsed.keyInsight || !parsed.nextStep) {
            throw new Error('Missing required base fields');
        }

        // Return appropriate type based on tier
        if (tier === 'full') {
            return parsed as FullSections;
        } else if (tier === 'medium') {
            return parsed as MediumSections;
        }

        return parsed as StandardSections;

    } catch (error) {
        logger.error('Failed to parse AI JSON response', error as Error);
        throw new Error('Invalid AI response format');
    }
}

// ===========================================
// MAIN SOLUTION FUNCTION
// ===========================================

/**
 * Solve a problem using tier-specific master prompt
 * Returns structured JSON response
 */
export const solveProblem = async (
    problemStatement: string,
    tier: string,
    txHash?: string
): Promise<SolutionResponse> => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-3-pro", // Latest Gemini 3 Pro (Nov 2025)
            generationConfig: {
                responseMimeType: "application/json", // Request JSON output
            }
        });

        // 1. Sanitize input
        const { sanitized, flags } = sanitizeInput(problemStatement);

        if (flags.length > 0) {
            logger.warn('Potential prompt injection attempt', {
                flagCount: flags.length,
                tier
            });
        }

        // 2. Get tier-specific master prompt
        const prompt = getMasterPrompt(tier, sanitized);

        // 3. Generate response
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 4. Extract and parse JSON
        const jsonText = extractJSON(text);
        const sections = parseAndValidateResponse(jsonText, tier);

        // 5. Build complete response
        const solutionResponse: SolutionResponse = {
            meta: {
                originalProblem: problemStatement, // Keep original, not sanitized
                tier: tier as 'standard' | 'medium' | 'full',
                provider: 'gemini',
                generatedAt: Date.now(),
                txHash
            },
            sections,
            rawMarkdown: convertToMarkdown(sections, tier) // For backward compatibility
        };

        return solutionResponse;

    } catch (error) {
        logger.error('AI service error', error instanceof Error ? error : new Error(String(error)));
        throw new Error("Failed to generate solution");
    }
};

/**
 * Legacy function for backward compatibility
 * Returns markdown string instead of structured response
 */
export const solveProblemLegacy = async (
    problemStatement: string,
    tier: string
): Promise<string> => {
    const response = await solveProblem(problemStatement, tier);
    return response.rawMarkdown || '';
};

// ===========================================
// MARKDOWN CONVERSION (for backward compatibility)
// ===========================================

function convertToMarkdown(sections: SolutionSections, tier: string): string {
    let md = '';

    // Base sections (all tiers)
    md += `## Executive Summary\n\n${sections.executiveSummary}\n\n`;
    md += `## Key Insight\n\n${sections.keyInsight}\n\n`;
    md += `## Recommended Next Step\n\n${sections.nextStep}\n\n`;

    // Medium tier additions
    if ('problemAnalysis' in sections) {
        const s = sections as MediumSections;

        md += `## Problem Analysis\n\n`;
        md += `**Core Problem:** ${s.problemAnalysis.coreProblem}\n\n`;
        md += `**Root Causes:**\n`;
        s.problemAnalysis.rootCauses.forEach(c => md += `- ${c}\n`);
        md += `\n**Impact Areas:**\n`;
        s.problemAnalysis.impactAreas.forEach(a => md += `- ${a}\n`);
        md += '\n';

        md += `## Strategic Recommendations\n\n`;
        md += `### Immediate (24h)\n`;
        s.strategicRecommendations.immediate.forEach(r => md += `- ${r}\n`);
        md += `\n### Short-Term (1 week)\n`;
        s.strategicRecommendations.shortTerm.forEach(r => md += `- ${r}\n`);
        md += `\n### Long-Term\n`;
        s.strategicRecommendations.longTerm.forEach(r => md += `- ${r}\n`);
        md += '\n';

        md += `## Risk Assessment\n\n`;
        md += `**Risks:**\n`;
        s.riskAssessment.risks.forEach(r => md += `- ⚠️ ${r}\n`);
        md += `\n**Mitigations:**\n`;
        s.riskAssessment.mitigations.forEach(m => md += `- ✅ ${m}\n`);
        md += '\n';
    }

    // Full tier additions
    if ('theoreticalFramework' in sections) {
        const s = sections as FullSections;

        md += `## Theoretical Framework\n\n`;
        md += `**Applicable Frameworks:** ${s.theoreticalFramework.frameworks.join(', ')}\n\n`;
        md += `${s.theoreticalFramework.application}\n\n`;

        md += `## Stakeholder Analysis\n\n`;
        s.stakeholderAnalysis.forEach(sa => {
            md += `### ${sa.stakeholder}\n`;
            md += `**Perspective:** ${sa.perspective}\n`;
            md += `**Concerns:**\n`;
            sa.concerns.forEach(c => md += `- ${c}\n`);
            md += '\n';
        });

        md += `## Market Context\n\n`;
        md += `**Trends:**\n`;
        s.marketContext.trends.forEach(t => md += `- 📈 ${t}\n`);
        md += `\n**Competitive Landscape:** ${s.marketContext.competitiveLandscape}\n\n`;
        md += `**Opportunities:**\n`;
        s.marketContext.opportunities.forEach(o => md += `- 🎯 ${o}\n`);
        md += '\n';

        md += `## Projected Outcomes\n\n`;
        md += `**Expected Impact:** ${s.projectedOutcomes.expectedImpact}\n`;
        md += `**Confidence:** ${s.projectedOutcomes.confidence}%\n\n`;
        md += `| Metric | Current | Target | Timeframe |\n`;
        md += `|--------|---------|--------|------------|\n`;
        s.projectedOutcomes.metrics.forEach(m => {
            md += `| ${m.name} | ${m.currentValue || '-'} | ${m.targetValue} | ${m.timeframe} |\n`;
        });
        md += '\n';

        md += `## Implementation Roadmap\n\n`;
        s.implementationRoadmap.forEach((phase, i) => {
            md += `### ${phase.phase} (${phase.duration})\n`;
            md += `**Activities:**\n`;
            phase.keyActivities.forEach(a => md += `- ${a}\n`);
            md += `**Deliverables:**\n`;
            phase.deliverables.forEach(d => md += `- 📦 ${d}\n`);
            md += '\n';
        });
    }

    return md;
}

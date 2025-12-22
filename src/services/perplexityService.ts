// ===========================================
// PERPLEXITY SERVICE - Sonar Pro API Integration
// ===========================================

import OpenAI from 'openai';
import { readFileSync } from 'fs';
import path from 'path';
import { config } from '../config';
import { logger } from '../utils/logger';
import { perplexityCircuit, CircuitBreaker } from '../lib/circuitBreaker';
import {
    PerplexityUsage,
    ParsedSections,
    FigmaPrompts,
    ValidationResult,
    SectionValidation
} from '../types/report';

// ===========================================
// PERPLEXITY CLIENT
// ===========================================

let perplexityClient: OpenAI | null = null;

/**
 * Get or create Perplexity API client (OpenAI-compatible)
 */
function getPerplexityClient(): OpenAI {
    if (!perplexityClient) {
        const apiKey = config.PERPLEXITY_API_KEY;

        if (!apiKey) {
            throw new Error('PERPLEXITY_API_KEY is not configured');
        }

        perplexityClient = new OpenAI({
            apiKey,
            baseURL: 'https://api.perplexity.ai'
        });

        logger.info('Perplexity client initialized', { model: config.PERPLEXITY_MODEL });
    }

    return perplexityClient;
}

// ===========================================
// MASTER PROMPT LOADING
// ===========================================

let cachedMasterPrompt: string | null = null;

/**
 * Load master prompt from file (cached)
 */
function getMasterPrompt(): string {
    if (!cachedMasterPrompt) {
        const promptPath = path.join(__dirname, '../prompts/masterPrompt.txt');

        try {
            cachedMasterPrompt = readFileSync(promptPath, 'utf-8');
            logger.info('Master prompt loaded', { path: promptPath, length: cachedMasterPrompt.length });
        } catch (error) {
            logger.error('Failed to load master prompt', error as Error);
            throw new Error('Master prompt file not found');
        }
    }

    return cachedMasterPrompt;
}

/**
 * Build the system prompt with user context
 */
function buildSystemPrompt(userContext?: {
    location?: string;
    language?: string;
    industry?: string;
}): string {
    const masterPrompt = getMasterPrompt();

    const contextBlock = `
DETECTED USER CONTEXT:
- Location: ${userContext?.location || 'Unknown'}
- Preferred Language: ${userContext?.language || 'English'}
- Industry Hints: ${userContext?.industry || 'Auto-detect'}

Current Date: ${new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}
`;

    // Insert context after the problem statement placeholder
    return masterPrompt + '\n\n' + contextBlock;
}

// ===========================================
// SECTION DEFINITIONS
// ===========================================

const EXPECTED_SECTIONS = [
    { id: 'section0', pattern: /SECTION\s*0|EXECUTIVE\s*SUMMARY/i, name: 'Executive Summary' },
    { id: 'operatorGuide', pattern: /OPERATOR\s*GUIDE/i, name: 'Operator Guide' },
    { id: 'section1', pattern: /SECTION\s*1|ASSUMPTION\s*LEDGER/i, name: 'Assumption Ledger' },
    { id: 'section2', pattern: /SECTION\s*2|PRODUCT\s*STRATEGY/i, name: 'Product Strategy' },
    { id: 'section3', pattern: /SECTION\s*3|RESEARCH.*PLAN/i, name: 'Research Plan' },
    { id: 'section4', pattern: /SECTION\s*4|UX\s*BLUEPRINT/i, name: 'UX Blueprint' },
    { id: 'section5', pattern: /SECTION\s*5|SCREEN.*SPECIFICATION/i, name: 'Screen Specs' },
    { id: 'section6', pattern: /SECTION\s*6|VALIDATION\s*RULES/i, name: 'Validation Rules' },
    { id: 'section7', pattern: /SECTION\s*7|VALIDATION\s*RATIONALE/i, name: 'Validation Rationale' },
    { id: 'section8', pattern: /SECTION\s*8|RESILIENCE|ERROR\s*STATES/i, name: 'Resilience Map' },
    { id: 'section9', pattern: /SECTION\s*9|DESIGN\s*QUALITY/i, name: 'Design Audit' },
    { id: 'section10', pattern: /SECTION\s*10|IMPLEMENTATION.*SPECS/i, name: 'Implementation Specs' },
    { id: 'section11', pattern: /SECTION\s*11|TECHNICAL.*PLAN/i, name: 'Technical Plan' },
    { id: 'section12', pattern: /SECTION\s*12|TEAM.*DELIVERY/i, name: 'Team & Delivery' },
    { id: 'section13', pattern: /SECTION\s*13|COST\s*MODEL/i, name: 'Cost Model' },
    { id: 'section14', pattern: /SECTION\s*14|BUSINESS\s*CASE|ROI/i, name: 'Business Case' },
    { id: 'section15', pattern: /SECTION\s*15|EVIDENCE\s*TABLE/i, name: 'Evidence Table' },
    { id: 'section16', pattern: /SECTION\s*16|FIGMA.*PROMPT/i, name: 'Figma Prompts' },
    { id: 'section17', pattern: /SECTION\s*17|FIGMA.*QA/i, name: 'Figma QA' },
    { id: 'section18', pattern: /SECTION\s*18|VERIFICATION.*GATE/i, name: 'Verification Gate' }
];

// ===========================================
// MARKDOWN PARSING
// ===========================================

/**
 * Validate that all expected sections are present
 */
export function validateSections(markdown: string): ValidationResult {
    const lines = markdown.split('\n');
    const sections: SectionValidation[] = [];
    const warnings: string[] = [];

    for (const expected of EXPECTED_SECTIONS) {
        let found = false;
        let lineStart: number | undefined;
        let lineEnd: number | undefined;

        for (let i = 0; i < lines.length; i++) {
            if (expected.pattern.test(lines[i])) {
                found = true;
                lineStart = i + 1;

                // Find next section or end
                for (let j = i + 1; j < lines.length; j++) {
                    const isNextSection = EXPECTED_SECTIONS.some(s =>
                        s.id !== expected.id && s.pattern.test(lines[j])
                    );
                    if (isNextSection) {
                        lineEnd = j;
                        break;
                    }
                }
                if (!lineEnd) lineEnd = lines.length;
                break;
            }
        }

        const sectionContent = found && lineStart && lineEnd
            ? lines.slice(lineStart - 1, lineEnd).join(' ')
            : '';

        sections.push({
            sectionId: expected.id,
            found,
            lineStart,
            lineEnd,
            wordCount: sectionContent.split(/\s+/).filter(w => w.length > 0).length
        });

        if (!found) {
            warnings.push(`Missing section: ${expected.name} (${expected.id})`);
        }
    }

    const foundSections = sections.filter(s => s.found).length;
    const isComplete = foundSections >= EXPECTED_SECTIONS.length * 0.8; // 80% threshold

    return {
        isComplete,
        totalSections: EXPECTED_SECTIONS.length,
        foundSections,
        missingSections: EXPECTED_SECTIONS.filter(e =>
            !sections.find(s => s.sectionId === e.id && s.found)
        ).map(e => e.id),
        sections,
        warnings
    };
}

/**
 * Parse markdown into structured sections
 */
export function parseMarkdownSections(markdown: string): ParsedSections {
    const lines = markdown.split('\n');
    const parsed: ParsedSections = {};

    for (const expected of EXPECTED_SECTIONS) {
        for (let i = 0; i < lines.length; i++) {
            if (expected.pattern.test(lines[i])) {
                // Find content until next section
                let endLine = lines.length;
                for (let j = i + 1; j < lines.length; j++) {
                    const isNextSection = EXPECTED_SECTIONS.some(s =>
                        s.id !== expected.id && s.pattern.test(lines[j])
                    );
                    if (isNextSection) {
                        endLine = j;
                        break;
                    }
                }

                const content = lines.slice(i, endLine).join('\n').trim();
                const key = `${expected.id.replace('section', 'section')}_${expected.name.replace(/\s+/g, '')}` as keyof ParsedSections;

                // Map to ParsedSections property
                switch (expected.id) {
                    case 'section0': parsed.section0_executiveSummary = content; break;
                    case 'operatorGuide': parsed.section0_operatorGuide = content; break;
                    case 'section1': parsed.section1_assumptionLedger = content; break;
                    case 'section2': parsed.section2_productStrategy = content; break;
                    case 'section3': parsed.section3_researchPlan = content; break;
                    case 'section4': parsed.section4_uxBlueprint = content; break;
                    case 'section5': parsed.section5_screenSpecs = content; break;
                    case 'section6': parsed.section6_validationRules = content; break;
                    case 'section7': parsed.section7_validationRationale = content; break;
                    case 'section8': parsed.section8_resilienceMap = content; break;
                    case 'section9': parsed.section9_designAudit = content; break;
                    case 'section10': parsed.section10_implementationSpecs = content; break;
                    case 'section11': parsed.section11_technicalPlan = content; break;
                    case 'section12': parsed.section12_teamDelivery = content; break;
                    case 'section13': parsed.section13_costModel = content; break;
                    case 'section14': parsed.section14_businessCase = content; break;
                    case 'section15': parsed.section15_evidenceTable = content; break;
                    case 'section16': parsed.section16_figmaPrompts = content; break;
                    case 'section17': parsed.section17_figmaQA = content; break;
                    case 'section18': parsed.section18_verificationGate = content; break;
                }
                break;
            }
        }
    }

    return parsed;
}

/**
 * Extract Figma prompts from Section 16
 */
export function extractFigmaPrompts(section16Content: string): FigmaPrompts {
    const prompts: FigmaPrompts = {};

    // Look for code blocks or Prompt A/B/C markers
    const promptAMatch = section16Content.match(/Prompt\s*A[^\n]*\n([\s\S]*?)(?=Prompt\s*[BC]|$)/i);
    const promptBMatch = section16Content.match(/Prompt\s*B[^\n]*\n([\s\S]*?)(?=Prompt\s*C|$)/i);
    const promptCMatch = section16Content.match(/Prompt\s*C[^\n]*\n([\s\S]*?)$/i);
    const prompt0Match = section16Content.match(/Prompt\s*0[^\n]*\n([\s\S]*?)(?=Prompt\s*A|$)/i);

    if (promptAMatch) prompts.promptA_happyPath = promptAMatch[1].trim();
    if (promptBMatch) prompts.promptB_errorRecovery = promptBMatch[1].trim();
    if (promptCMatch) prompts.promptC_componentLibrary = promptCMatch[1].trim();
    if (prompt0Match) prompts.prompt0_foundations = prompt0Match[1].trim();

    return prompts;
}

// ===========================================
// COST CALCULATION
// ===========================================

/**
 * Calculate API cost based on usage
 */
export function calculateCost(usage: {
    inputTokens: number;
    outputTokens: number;
    searchCount?: number;
}): number {
    // Perplexity Sonar Pro pricing (as of Dec 2024)
    const INPUT_COST = 3 / 1_000_000;   // $3 per 1M input tokens
    const OUTPUT_COST = 15 / 1_000_000; // $15 per 1M output tokens
    const SEARCH_COST = 5 / 1000;       // $5 per 1k searches

    const inputCost = usage.inputTokens * INPUT_COST;
    const outputCost = usage.outputTokens * OUTPUT_COST;
    const searchCost = (usage.searchCount || 3) * SEARCH_COST;

    return Math.round((inputCost + outputCost + searchCost) * 100) / 100;
}

// ===========================================
// MAIN API FUNCTIONS
// ===========================================

export interface AnalysisResult {
    markdown: string;
    usage: PerplexityUsage;
    validation: ValidationResult;
    parsedSections: ParsedSections;
}

/**
 * Generate full analysis using Perplexity Sonar Pro
 * This is the main function for Section 0-15
 */
export async function generateAnalysis(
    problemStatement: string,
    userContext?: {
        location?: string;
        language?: string;
        industry?: string;
    }
): Promise<AnalysisResult> {
    const client = getPerplexityClient();
    const systemPrompt = buildSystemPrompt(userContext);
    const startTime = Date.now();

    // Prepare the user message with problem statement
    const userMessage = `problem statement: ${problemStatement}`;

    logger.info('Starting Perplexity analysis', {
        problemLength: problemStatement.length,
        model: config.PERPLEXITY_MODEL
    });

    // Execute with circuit breaker protection
    const completion = await perplexityCircuit.execute(async () => {
        return client.chat.completions.create({
            model: config.PERPLEXITY_MODEL || 'sonar-pro',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            max_tokens: config.PERPLEXITY_MAX_TOKENS || 60000,
            temperature: 0.2,  // Consistent output
            top_p: 0.9
        });
    });

    const markdown = completion.choices[0]?.message?.content || '';
    const processingTimeMs = Date.now() - startTime;

    // Build usage data
    const usage: PerplexityUsage = {
        inputTokens: completion.usage?.prompt_tokens || 0,
        outputTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
        searchCount: 3, // Approximate - Sonar Pro typically does 3 searches
        estimatedCost: calculateCost({
            inputTokens: completion.usage?.prompt_tokens || 0,
            outputTokens: completion.usage?.completion_tokens || 0
        }),
        model: completion.model,
        processingTimeMs
    };

    // Validate and parse sections
    const validation = validateSections(markdown);
    const parsedSections = parseMarkdownSections(markdown);

    logger.info('Perplexity analysis completed', {
        outputTokens: usage.outputTokens,
        processingTimeMs,
        sectionsFound: validation.foundSections,
        isComplete: validation.isComplete
    });

    return {
        markdown,
        usage,
        validation,
        parsedSections
    };
}

export interface FigmaResult {
    prompts: FigmaPrompts;
    usage: PerplexityUsage;
}

/**
 * Generate Figma prompts based on analysis context
 * This is for Section 16-18 if they need regeneration
 */
export async function generateFigmaPrompts(
    analysisContext: string
): Promise<FigmaResult> {
    const client = getPerplexityClient();
    const startTime = Date.now();

    const figmaSystemPrompt = `You are a Senior UI/UX Designer creating high-fidelity Figma prompts.
Based on the analysis context provided, generate detailed Figma AI prompts for:

Prompt A - Happy path high fidelity UI (core screens up to 8)
Prompt B - Critical error plus recovery high fidelity UI
Prompt C - Component library plus variants page

Each prompt must include:
- Platform and frame sizes
- Grid and 8pt spacing
- Type scale and hierarchy
- Auto layout rules
- Component naming and variants
- States: default, hover, focus, loading, disabled, error, success, empty
- Real microcopy (no lorem ipsum)
- Accessibility intent
- Enterprise-grade visual style

Format each prompt in a code block.`;

    logger.info('Starting Figma prompt generation');

    const completion = await perplexityCircuit.execute(async () => {
        return client.chat.completions.create({
            model: config.PERPLEXITY_MODEL || 'sonar-pro',
            messages: [
                { role: 'system', content: figmaSystemPrompt },
                { role: 'user', content: `Generate Figma prompts based on this analysis:\n\n${analysisContext}` }
            ],
            max_tokens: 20000,
            temperature: 0.3
        });
    });

    const content = completion.choices[0]?.message?.content || '';
    const processingTimeMs = Date.now() - startTime;

    const usage: PerplexityUsage = {
        inputTokens: completion.usage?.prompt_tokens || 0,
        outputTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
        estimatedCost: calculateCost({
            inputTokens: completion.usage?.prompt_tokens || 0,
            outputTokens: completion.usage?.completion_tokens || 0
        }),
        model: completion.model,
        processingTimeMs
    };

    const prompts = extractFigmaPrompts(content);

    logger.info('Figma prompts generated', {
        outputTokens: usage.outputTokens,
        processingTimeMs,
        hasPromptA: !!prompts.promptA_happyPath,
        hasPromptB: !!prompts.promptB_errorRecovery,
        hasPromptC: !!prompts.promptC_componentLibrary
    });

    return { prompts, usage };
}

// ===========================================
// HEALTH CHECK
// ===========================================

/**
 * Check if Perplexity API is configured and healthy
 */
export function isPerplexityConfigured(): boolean {
    return !!config.PERPLEXITY_API_KEY;
}

/**
 * Get Perplexity service health
 */
export function getPerplexityHealth(): {
    configured: boolean;
    circuitState: string;
    circuitMetrics: ReturnType<typeof perplexityCircuit.getMetrics>;
} {
    return {
        configured: isPerplexityConfigured(),
        circuitState: perplexityCircuit.getState(),
        circuitMetrics: perplexityCircuit.getMetrics()
    };
}

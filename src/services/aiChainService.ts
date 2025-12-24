// ===========================================
// AI CHAIN SERVICE - Multi-Part Sequential Streaming
// Implements 4-part conversation chain with Perplexity API
// ===========================================

import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
    MultiPartResult,
    ChainCallbacks,
    PART_CONFIGS
} from '../types/multiPartTypes';
import {
    MULTI_PART_SYSTEM_PROMPT,
    getMultiPartInitialPrompt,
    getMultiPartContinuePrompt,
    getMultiPartModelConfig
} from '../prompts/masterPrompts';

// Initialize Perplexity client
let aiClient: OpenAI | null = null;
if (config.PERPLEXITY_API_KEY) {
    aiClient = new OpenAI({
        apiKey: config.PERPLEXITY_API_KEY,
        baseURL: 'https://api.perplexity.ai'
    });
}

// Types for conversation history
interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Generate a 4-part UX analysis using sequential API calls
 * Maintains conversation context across all parts
 * Supports streaming via callbacks
 */
export async function generateMultiPartAnalysis(
    userProblem: string,
    tier: string,
    callbacks: ChainCallbacks
): Promise<MultiPartResult> {
    if (!aiClient) {
        const error = new Error('Perplexity API not configured');
        callbacks.onError(error);
        throw error;
    }

    // Only use multi-part for full/premium tiers
    if (tier !== 'full' && tier !== 'premium') {
        const error = new Error(`Multi-part analysis only available for full/premium tiers, got: ${tier}`);
        callbacks.onError(error);
        throw error;
    }

    const result: MultiPartResult = {
        part1: '',
        part2: '',
        part3: '',
        part4: '',
        fullMarkdown: '',
        generatedAt: 0,
        totalTokens: 0
    };

    // Conversation history to maintain context
    const conversationHistory: ChatMessage[] = [
        {
            role: 'system',
            content: MULTI_PART_SYSTEM_PROMPT
        }
    ];

    try {
        // Process each of the 4 parts sequentially
        for (let partNum = 1; partNum <= 4; partNum++) {
            logger.info(`Starting Part ${partNum}/4 generation`, { tier });

            // Build the prompt for this part
            const userPrompt = partNum === 1
                ? getMultiPartInitialPrompt(userProblem)
                : getMultiPartContinuePrompt(partNum as 2 | 3 | 4);

            // Add user prompt to conversation history
            conversationHistory.push({
                role: 'user',
                content: userPrompt
            });

            // Get model config for this part
            const modelConfig = getMultiPartModelConfig(partNum);

            // Make streaming API call
            const partContent = await streamPart(
                partNum,
                conversationHistory,
                modelConfig,
                callbacks
            );

            // Store the result
            const partKey = `part${partNum}` as keyof Pick<MultiPartResult, 'part1' | 'part2' | 'part3' | 'part4'>;
            result[partKey] = partContent;

            // Add assistant response to conversation history for next part
            conversationHistory.push({
                role: 'assistant',
                content: partContent
            });

            // Notify part completion
            callbacks.onPartComplete(partNum, partContent);

            logger.info(`Completed Part ${partNum}/4`, {
                contentLength: partContent.length
            });
        }

        // Combine all parts into full markdown
        result.fullMarkdown = [
            '# UX Analysis Report\n',
            '## Part 1: Discovery & Problem Analysis\n',
            result.part1,
            '\n---\n',
            '## Part 2: Strategic Design & Roadmap\n',
            result.part2,
            '\n---\n',
            '## Part 3: AI Toolkit & Figma Prompts\n',
            result.part3,
            '\n---\n',
            '## Part 4: Risk, Metrics & Rationale\n',
            result.part4
        ].join('\n');

        result.generatedAt = Date.now();

        // Notify completion
        callbacks.onComplete(result);

        logger.info('Multi-part analysis completed', {
            totalLength: result.fullMarkdown.length,
            totalTokens: result.totalTokens
        });

        return result;

    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Multi-part analysis failed', err);
        callbacks.onError(err);
        throw err;
    }
}

/**
 * Stream a single part of the analysis
 */
async function streamPart(
    partNum: number,
    conversationHistory: ChatMessage[],
    modelConfig: { model: string; maxTokens: number; temperature: number },
    callbacks: ChainCallbacks
): Promise<string> {
    let fullContent = '';

    try {
        const stream = await aiClient!.chat.completions.create({
            model: modelConfig.model,
            messages: conversationHistory,
            max_tokens: modelConfig.maxTokens,
            temperature: modelConfig.temperature,
            stream: true
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                fullContent += content;
                callbacks.onChunk(partNum, content);
            }
        }

        return fullContent;

    } catch (error) {
        logger.error(`Failed to stream Part ${partNum}`, error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}

/**
 * Generate multi-part analysis without streaming (for background processing)
 * Returns the complete result after all parts are generated
 */
export async function generateMultiPartAnalysisSync(
    userProblem: string,
    tier: string
): Promise<MultiPartResult> {
    // Create no-op callbacks for sync mode
    const noopCallbacks: ChainCallbacks = {
        onChunk: () => { },
        onPartComplete: (part, content) => {
            logger.debug(`Part ${part} complete (sync mode)`, { length: content.length });
        },
        onComplete: () => { },
        onError: (error) => {
            logger.error('Sync generation error', error);
        }
    };

    return generateMultiPartAnalysis(userProblem, tier, noopCallbacks);
}

/**
 * Check if multi-part analysis is available
 */
export function isMultiPartAvailable(): boolean {
    return !!aiClient;
}

/**
 * Get the list of part descriptions for UI display
 */
export function getPartDescriptions(): Array<{ part: number; name: string; description: string }> {
    return PART_CONFIGS.map(config => ({
        part: config.partNumber,
        name: `Part ${config.partNumber}`,
        description: config.description
    }));
}

// ===========================================
// MULTI-PART ANALYSIS TYPES
// Types for 4-part sequential streaming AI analysis
// ===========================================

/**
 * Result of a complete 4-part analysis
 */
export interface MultiPartResult {
    /** Part 1: Discovery & Problem Analysis */
    part1: string;
    /** Part 2: Strategic Design & Roadmap */
    part2: string;
    /** Part 3: AI Toolkit & Figma Prompts */
    part3: string;
    /** Part 4: Risk, Metrics & Rationale */
    part4: string;
    /** Combined markdown of all parts */
    fullMarkdown: string;
    /** Timestamp when generation completed */
    generatedAt: number;
    /** Total tokens used across all parts */
    totalTokens?: number;
}

/**
 * Status of an analysis session
 */
export type AnalysisStatus = 'pending' | 'streaming' | 'completed' | 'failed';

/**
 * Tracks the state of an ongoing analysis
 */
export interface AnalysisSession {
    /** Stripe/Coinbase session ID */
    sessionId: string;
    /** Socket.io socket ID (if connected) */
    socketId?: string;
    /** Current status */
    status: AnalysisStatus;
    /** Which part is currently being generated (1-4) */
    currentPart: number;
    /** Accumulated content per part */
    parts: Record<number, string>;
    /** User's problem statement */
    problemStatement: string;
    /** Selected tier */
    tier: string;
    /** Customer email (if available) */
    customerEmail?: string;
    /** When the session was created */
    createdAt: number;
}

/**
 * Callbacks for streaming analysis events
 */
export interface ChainCallbacks {
    /** Called for each streaming chunk */
    onChunk: (part: number, chunk: string) => void;
    /** Called when a part is fully complete */
    onPartComplete: (part: number, content: string) => void;
    /** Called when all 4 parts are complete */
    onComplete: (fullResult: MultiPartResult) => void;
    /** Called on error */
    onError: (error: Error) => void;
}

/**
 * Configuration for a single part generation
 */
export interface PartConfig {
    /** Part number (1-4) */
    partNumber: number;
    /** Maximum tokens for this part */
    maxTokens: number;
    /** Temperature for generation */
    temperature: number;
    /** Description of this part's focus */
    description: string;
}

/**
 * Part configurations with their token limits
 */
export const PART_CONFIGS: PartConfig[] = [
    {
        partNumber: 1,
        maxTokens: 2000,
        temperature: 0.2,
        description: 'Discovery & Problem Analysis'
    },
    {
        partNumber: 2,
        maxTokens: 2500,
        temperature: 0.2,
        description: 'Strategic Design & Roadmap'
    },
    {
        partNumber: 3,
        maxTokens: 2500,
        temperature: 0.3, // Slightly higher for creative Figma prompts
        description: 'AI Toolkit & Figma Prompts'
    },
    {
        partNumber: 4,
        maxTokens: 2000,
        temperature: 0.2,
        description: 'Risk, Metrics & Rationale'
    }
];

/**
 * Socket.io event payloads
 */
export interface SocketEvents {
    // Client -> Server
    'start-analysis': { sessionId: string };

    // Server -> Client
    'analysis-chunk': { part: number; chunk: string };
    'part-complete': { part: number; partContent: string };
    'analysis-complete': { success: true; magicLink?: string };
    'analysis-error': { error: string };
    'analysis-progress': { part: number; totalParts: 4; status: string };
}

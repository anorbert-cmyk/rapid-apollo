// ===========================================
// SOCKET HANDLERS - Analysis Streaming
// Handles real-time streaming of multi-part AI analysis
// ===========================================

import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import {
    generateMultiPartAnalysis,
    isMultiPartAvailable
} from '../services/aiChainService';
import { ChainCallbacks, AnalysisSession } from '../types/multiPartTypes';
import * as redisStore from '../utils/redisStore';
import { createMagicLink, getMagicLinkUrl } from '../services/magicLinkService';
import { sendRapidApolloEmail, isEmailConfigured } from '../services/emailService';
import { config } from '../config';
import * as solutionRepo from '../db/solutionRepository';
import { isDatabaseAvailable } from '../db';

// In-memory session tracking (could be moved to Redis for multi-instance)
const activeSessions = new Map<string, AnalysisSession>();

// Track socket connections by session ID
const sessionToSocket = new Map<string, string>();
const socketToSession = new Map<string, string>();

/**
 * Setup Socket.io event handlers
 */
export function setupSocketHandlers(io: SocketIOServer): void {
    logger.info('Setting up Socket.io handlers for analysis streaming');

    io.on('connection', (socket: Socket) => {
        logger.debug('Socket connected', { socketId: socket.id });

        // Handle analysis start request
        socket.on('start-analysis', async (data: { sessionId: string }) => {
            await handleStartAnalysis(socket, data.sessionId);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            handleDisconnect(socket);
        });

        // Handle reconnection attempt
        socket.on('rejoin-session', async (data: { sessionId: string }) => {
            await handleRejoin(socket, data.sessionId);
        });
    });
}

/**
 * Handle request to start analysis
 */
async function handleStartAnalysis(socket: Socket, sessionId: string): Promise<void> {
    try {
        logger.info('Analysis start requested', { sessionId, socketId: socket.id });

        // Validate session ID
        if (!sessionId) {
            socket.emit('analysis-error', { error: 'Missing session ID' });
            return;
        }

        // Check if multi-part is available
        if (!isMultiPartAvailable()) {
            socket.emit('analysis-error', { error: 'AI service not available' });
            return;
        }

        // Get session data from Redis
        const sessionKey = `payment_session:${sessionId}`;
        const sessionData = await redisStore.get(sessionKey);

        if (!sessionData) {
            socket.emit('analysis-error', { error: 'Session not found or expired' });
            return;
        }

        const parsedSession = JSON.parse(sessionData);

        // Check if analysis is already in progress or completed
        if (activeSessions.has(sessionId)) {
            const existingSession = activeSessions.get(sessionId)!;
            if (existingSession.status === 'completed') {
                socket.emit('analysis-complete', { success: true, cached: true });
                return;
            }
            if (existingSession.status === 'streaming') {
                // Allow reconnection - associate this socket with the session
                sessionToSocket.set(sessionId, socket.id);
                socketToSession.set(socket.id, sessionId);
                socket.emit('analysis-progress', {
                    part: existingSession.currentPart,
                    totalParts: 4,
                    status: 'reconnected'
                });
                return;
            }
        }

        // Create new analysis session
        const analysisSession: AnalysisSession = {
            sessionId,
            socketId: socket.id,
            status: 'streaming',
            currentPart: 1,
            parts: {},
            problemStatement: parsedSession.problemStatement,
            tier: parsedSession.tier,
            customerEmail: parsedSession.customerEmail,
            createdAt: Date.now()
        };

        activeSessions.set(sessionId, analysisSession);
        sessionToSocket.set(sessionId, socket.id);
        socketToSession.set(socket.id, sessionId);

        // Notify client that analysis is starting
        socket.emit('analysis-progress', {
            part: 1,
            totalParts: 4,
            status: 'starting'
        });

        // Create callbacks that emit to socket
        const callbacks: ChainCallbacks = {
            onChunk: (part, chunk) => {
                const currentSocketId = sessionToSocket.get(sessionId);
                if (currentSocketId) {
                    // Emit directly to the connected socket
                    socket.emit('analysis-chunk', { part, chunk });
                }
                // Store chunk in session for reconnection support
                if (analysisSession.parts[part]) {
                    analysisSession.parts[part] += chunk;
                } else {
                    analysisSession.parts[part] = chunk;
                }
            },
            onPartComplete: (part, content) => {
                analysisSession.currentPart = part + 1;
                analysisSession.parts[part] = content;

                const currentSocketId = sessionToSocket.get(sessionId);
                if (currentSocketId) {
                    socket.emit('part-complete', { part, partContent: content.substring(0, 200) + '...' });
                    socket.emit('analysis-progress', {
                        part: part + 1,
                        totalParts: 4,
                        status: part < 4 ? 'continuing' : 'finalizing'
                    });
                }
                logger.info(`Part ${part} complete for session`, { sessionId });
            },
            onComplete: async (result) => {
                analysisSession.status = 'completed';

                // Save to database
                await saveAnalysisResult(sessionId, analysisSession, result.fullMarkdown);

                // Send magic link email
                const magicLink = await sendCompletionEmail(sessionId, analysisSession, result.fullMarkdown);

                // Notify client
                const currentSocketId = sessionToSocket.get(sessionId);
                if (currentSocketId) {
                    socket.emit('analysis-complete', {
                        success: true,
                        magicLink: magicLink || undefined
                    });
                }

                logger.info('Analysis completed', { sessionId });
            },
            onError: (error) => {
                analysisSession.status = 'failed';
                socket.emit('analysis-error', { error: error.message });
                logger.error('Analysis failed', error);
            }
        };

        // Start the multi-part analysis
        await generateMultiPartAnalysis(
            parsedSession.problemStatement,
            parsedSession.tier,
            callbacks
        );

    } catch (error) {
        logger.error('Failed to start analysis', error instanceof Error ? error : new Error(String(error)));
        socket.emit('analysis-error', { error: 'Failed to start analysis' });
    }
}

/**
 * Handle socket disconnection
 */
function handleDisconnect(socket: Socket): void {
    const sessionId = socketToSession.get(socket.id);

    if (sessionId) {
        // Remove socket mappings but keep session alive
        // The backend continues processing even if frontend disconnects
        socketToSession.delete(socket.id);
        // Don't delete sessionToSocket - client might reconnect

        const session = activeSessions.get(sessionId);
        if (session && session.status === 'streaming') {
            logger.info('Client disconnected during streaming, continuing in background', {
                sessionId,
                currentPart: session.currentPart
            });
        }
    }

    logger.debug('Socket disconnected', { socketId: socket.id });
}

/**
 * Handle reconnection to existing session
 */
async function handleRejoin(socket: Socket, sessionId: string): Promise<void> {
    const session = activeSessions.get(sessionId);

    if (!session) {
        socket.emit('analysis-error', { error: 'Session not found' });
        return;
    }

    // Update mappings
    sessionToSocket.set(sessionId, socket.id);
    socketToSession.set(socket.id, sessionId);
    session.socketId = socket.id;

    if (session.status === 'completed') {
        socket.emit('analysis-complete', { success: true, reconnected: true });
    } else if (session.status === 'streaming') {
        socket.emit('analysis-progress', {
            part: session.currentPart,
            totalParts: 4,
            status: 'reconnected'
        });
        // Send accumulated content for completed parts
        for (const [partNum, content] of Object.entries(session.parts)) {
            if (parseInt(partNum) < session.currentPart) {
                socket.emit('part-complete', { part: parseInt(partNum), partContent: content });
            }
        }
    }

    logger.info('Client rejoined session', { sessionId, socketId: socket.id });
}

/**
 * Save analysis result to database
 */
async function saveAnalysisResult(
    sessionId: string,
    session: AnalysisSession,
    fullMarkdown: string
): Promise<void> {
    const txId = `streaming_${sessionId}`;

    try {
        if (isDatabaseAvailable() && session.customerEmail) {
            await solutionRepo.saveSolution(
                txId,
                session.customerEmail,
                session.tier as any,
                session.problemStatement,
                {
                    rawMarkdown: fullMarkdown,
                    sections: {
                        executiveSummary: 'See full report',
                        keyInsight: 'Multi-part analysis',
                        nextStep: 'Review report sections',
                        // Store individual parts for frontend rendering
                        part1: session.parts[1] || '',
                        part2: session.parts[2] || '',
                        part3: session.parts[3] || '',
                        part4: session.parts[4] || ''
                    },
                    meta: {
                        originalProblem: session.problemStatement,
                        tier: session.tier as any,
                        provider: 'perplexity-sonar',
                        generatedAt: Date.now(),
                        isMultiPart: true
                    }
                }
            );

            // Log transaction
            await solutionRepo.logTransaction(
                txId,
                session.customerEmail,
                session.tier as any
            );

            logger.info('Analysis saved to database', { sessionId, txId });
        }
    } catch (error) {
        logger.error('Failed to save analysis', error instanceof Error ? error : new Error(String(error)));
    }
}

/**
 * Send completion email with magic link
 */
async function sendCompletionEmail(
    sessionId: string,
    session: AnalysisSession,
    _fullMarkdown: string
): Promise<string | null> {
    if (!session.customerEmail || !isEmailConfigured()) {
        return null;
    }

    try {
        const txId = `streaming_${sessionId}`;

        // Create magic link
        const magicToken = await createMagicLink(
            session.customerEmail,
            txId,
            session.tier as any,
            session.problemStatement.substring(0, 200)
        );
        const magicLinkUrl = getMagicLinkUrl(magicToken);

        // Get price for tier
        const prices: Record<string, string> = {
            'standard': String(config.TIER_STANDARD_USD),
            'medium': String(config.TIER_MEDIUM_USD),
            'full': String(config.TIER_FULL_USD),
            'premium': String(config.TIER_PREMIUM_USD)
        };

        // Send email
        await sendRapidApolloEmail({
            to: session.customerEmail,
            userName: session.customerEmail.split('@')[0],
            magicLinkUrl,
            transactionId: txId,
            amount: prices[session.tier] || '0',
            currency: 'USD'
        });

        logger.info('Completion email sent', { sessionId });
        return magicLinkUrl;

    } catch (error) {
        logger.error('Failed to send completion email', error instanceof Error ? error : new Error(String(error)));
        return null;
    }
}

/**
 * Get active session by ID (for external use)
 */
export function getActiveSession(sessionId: string): AnalysisSession | undefined {
    return activeSessions.get(sessionId);
}

/**
 * Check if session is active
 */
export function isSessionActive(sessionId: string): boolean {
    const session = activeSessions.get(sessionId);
    return session?.status === 'streaming';
}

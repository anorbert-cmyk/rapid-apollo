import { z } from 'zod';

// Transaction Hash: 0x followed by 64 hex characters
export const txHashSchema = z.string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash format');

// Tier: One of the allowed values
export const tierSchema = z.enum(['standard', 'medium', 'full']);

// Solve Request Body
export const solveRequestSchema = z.object({
    problemStatement: z.string()
        .min(10, 'Problem statement must be at least 10 characters')
        .max(10000, 'Problem statement must be at most 10000 characters'),
    txHash: txHashSchema,
    tier: tierSchema
});

export type SolveRequest = z.infer<typeof solveRequestSchema>;

// ========================================
// Payment Request Schemas
// ========================================

// Problem statement for payment (required before checkout)
export const problemStatementSchema = z.string()
    .min(10, 'Problem statement must be at least 10 characters')
    .max(10000, 'Problem statement must be at most 10000 characters')
    .trim();

// Stripe Create Session Request
export const stripeSessionRequestSchema = z.object({
    tier: tierSchema,
    problemStatement: problemStatementSchema
});

export type StripeSessionRequest = z.infer<typeof stripeSessionRequestSchema>;

// Coinbase Create Charge Request
export const coinbaseChargeRequestSchema = z.object({
    tier: tierSchema,
    problemStatement: problemStatementSchema,
    walletAddress: z.string()
        .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address format')
        .optional()
});

export type CoinbaseChargeRequest = z.infer<typeof coinbaseChargeRequestSchema>;

// Webhook Idempotency Key (for preventing duplicate processing)
export const webhookIdempotencySchema = z.object({
    eventId: z.string().min(1, 'Event ID is required'),
    eventType: z.string().min(1, 'Event type is required'),
    timestamp: z.number().int().positive()
});

export type WebhookIdempotency = z.infer<typeof webhookIdempotencySchema>;


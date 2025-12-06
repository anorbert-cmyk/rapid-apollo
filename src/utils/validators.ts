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

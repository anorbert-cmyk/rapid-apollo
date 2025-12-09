import request from 'supertest';
import { app } from '../server';
import { verifyTransaction } from '../services/paymentService';
import { solveProblem } from '../services/aiService';
import { usedTxHashes } from '../store';
import { SolutionResponse } from '../types/solution';

// Mock dependencies
jest.mock('../services/paymentService');
jest.mock('../services/aiService');

// Typed mocks
const mockVerifyTransaction = verifyTransaction as jest.MockedFunction<typeof verifyTransaction>;
const mockSolveProblem = solveProblem as jest.MockedFunction<typeof solveProblem>;

// Helper to create mock SolutionResponse
function createMockResponse(solutionText: string, tier: 'standard' | 'medium' | 'full' = 'standard'): SolutionResponse {
    return {
        meta: {
            originalProblem: 'Test problem',
            tier,
            provider: 'gemini',
            generatedAt: Date.now()
        },
        sections: {
            executiveSummary: solutionText,
            keyInsight: 'Test insight',
            nextStep: 'Test next step'
        },
        rawMarkdown: solutionText
    };
}

describe('POST /api/solve (Integration)', () => {

    beforeEach(async () => {
        jest.clearAllMocks();
        if ((usedTxHashes as any).map) {
            (usedTxHashes as any).map.clear();
        }
    });

    const validPayload = {
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        problemStatement: 'Test problem',
        tier: 'standard'
    };

    it('should solve problem with valid payment', async () => {
        mockVerifyTransaction.mockResolvedValue({ valid: true, from: '0xClient' });
        mockSolveProblem.mockResolvedValue(createMockResponse('AI Solution'));

        const res = await request(app)
            .post('/api/solve')
            .send(validPayload);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.solution).toBe('AI Solution');
        expect(res.body.tier).toBe('standard');
        expect(res.body.sections).toBeDefined();
        expect(res.body.meta).toBeDefined();

        expect(mockVerifyTransaction).toHaveBeenCalledWith(validPayload.txHash, 'standard');
        expect(mockSolveProblem).toHaveBeenCalledWith('Test problem', 'standard', validPayload.txHash);
    });

    it('should reject invalid payment (402)', async () => {
        mockVerifyTransaction.mockResolvedValue({ valid: false, message: 'Insufficient funds' });

        const res = await request(app)
            .post('/api/solve')
            .send(validPayload);

        expect(res.status).toBe(402);
        expect(res.body.error).toBe('Insufficient funds');
        expect(mockSolveProblem).not.toHaveBeenCalled();
    });

    it('should detect double spend (409)', async () => {
        // First successful request
        mockVerifyTransaction.mockResolvedValue({ valid: true, from: '0xClient' });
        mockSolveProblem.mockResolvedValue(createMockResponse('AI Solution'));

        await request(app).post('/api/solve').send(validPayload);

        // Second request with SAME txHash
        const res = await request(app)
            .post('/api/solve')
            .send(validPayload);

        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/Transaction already processed/);
    });

    it('should validate standard tier logic', async () => {
        mockVerifyTransaction.mockResolvedValue({ valid: true, from: '0xClient' });
        mockSolveProblem.mockResolvedValue(createMockResponse('Standard Solution'));

        await request(app)
            .post('/api/solve')
            .send({ ...validPayload, tier: 'standard' });

        expect(mockSolveProblem).toHaveBeenCalledWith(expect.any(String), 'standard', expect.any(String));
    });

    it('should validate medium tier logic', async () => {
        mockVerifyTransaction.mockResolvedValue({ valid: true, from: '0xClient' });
        mockSolveProblem.mockResolvedValue(createMockResponse('Medium Solution', 'medium'));

        await request(app)
            .post('/api/solve')
            .send({ ...validPayload, tier: 'medium' });

        expect(mockSolveProblem).toHaveBeenCalledWith(expect.any(String), 'medium', expect.any(String));
    });

    it('should validate full tier logic', async () => {
        mockVerifyTransaction.mockResolvedValue({ valid: true, from: '0xClient' });
        mockSolveProblem.mockResolvedValue(createMockResponse('Full Solution', 'full'));

        await request(app)
            .post('/api/solve')
            .send({ ...validPayload, tier: 'full' });

        expect(mockSolveProblem).toHaveBeenCalledWith(expect.any(String), 'full', expect.any(String));
    });

    it('should reject invalid tier schema', async () => {
        const res = await request(app)
            .post('/api/solve')
            .send({ ...validPayload, tier: 'invalid_tier' });

        expect(res.status).toBe(400); // Zod validation error
    });

    it('should handle AI service failure (500)', async () => {
        mockVerifyTransaction.mockResolvedValue({ valid: true, from: '0xClient' });
        mockSolveProblem.mockRejectedValue(new Error('Gemini Error'));

        const res = await request(app)
            .post('/api/solve')
            .send(validPayload);

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Internal server error');
    });

    it('should validate input length (problem statement)', async () => {
        // Zod max is 10000. Send 10001 characters.
        // Body limit is 100kb, so this (10kb) stays well within limit.
        const longProblem = 'a'.repeat(10001);
        const res = await request(app)
            .post('/api/solve')
            .send({ ...validPayload, problemStatement: longProblem });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Validation failed/);
    });
});

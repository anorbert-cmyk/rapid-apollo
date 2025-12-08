import request from 'supertest';
import { app } from '../server';
import { verifyTransaction } from '../services/paymentService';
import { solveProblem } from '../services/aiService';
import { usedTxHashes } from '../store';

// Mock dependencies
jest.mock('../services/paymentService');
jest.mock('../services/aiService');

// Typed mocks
const mockVerifyTransaction = verifyTransaction as jest.MockedFunction<typeof verifyTransaction>;
const mockSolveProblem = solveProblem as jest.MockedFunction<typeof solveProblem>;

describe('POST /api/solve (Integration)', () => {

    beforeEach(async () => {
        jest.clearAllMocks();
        // Clear in-memory store if possible, or just mock usedTxHashes if needed
        // For usedTxHashes validation, we might need to manually clear it if it's singleton
        // But since we restart app? No, app is imported once.
        // We can manually clear the map if we cast it to any
        if ((usedTxHashes as any).map) {
            (usedTxHashes as any).map.clear();
        }
    });

    const validPayload = {
        // 66 chars: 0x + 64 random hex chars
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        problemStatement: 'Test problem',
        tier: 'standard'
    };

    it('should solve problem with valid payment', async () => {
        // Mock successful payment
        mockVerifyTransaction.mockResolvedValue({ valid: true, from: '0xClient' });
        // Mock AI response
        mockSolveProblem.mockResolvedValue('AI Solution');

        const res = await request(app)
            .post('/api/solve')
            .send(validPayload);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.solution).toBe('AI Solution');
        expect(res.body.tier).toBe('standard');

        // Verify mocks called
        expect(mockVerifyTransaction).toHaveBeenCalledWith(validPayload.txHash, 'standard');
        expect(mockSolveProblem).toHaveBeenCalledWith('Test problem', 'standard');
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
        mockSolveProblem.mockResolvedValue('AI Solution');

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
        mockSolveProblem.mockResolvedValue('Standard Solution');

        await request(app)
            .post('/api/solve')
            .send({ ...validPayload, tier: 'standard' });

        expect(mockSolveProblem).toHaveBeenCalledWith(expect.any(String), 'standard');
    });

    it('should validate medium tier logic', async () => {
        mockVerifyTransaction.mockResolvedValue({ valid: true, from: '0xClient' });
        mockSolveProblem.mockResolvedValue('Medium Solution');

        await request(app)
            .post('/api/solve')
            .send({ ...validPayload, tier: 'medium' });

        expect(mockSolveProblem).toHaveBeenCalledWith(expect.any(String), 'medium');
    });

    it('should validate full tier logic', async () => {
        mockVerifyTransaction.mockResolvedValue({ valid: true, from: '0xClient' });
        mockSolveProblem.mockResolvedValue('Full Solution');

        await request(app)
            .post('/api/solve')
            .send({ ...validPayload, tier: 'full' });

        expect(mockSolveProblem).toHaveBeenCalledWith(expect.any(String), 'full');
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

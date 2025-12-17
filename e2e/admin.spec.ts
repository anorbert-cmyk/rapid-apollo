import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
    // Note: These tests would require mocking admin wallet authentication
    // In a real scenario, you'd set up test fixtures with admin credentials

    test('admin endpoint should require authentication', async ({ request }) => {
        const response = await request.post('/api/admin/stats', {
            data: {
                address: '0x0000000000000000000000000000000000000000',
                signature: 'invalid-sig',
                timestamp: Date.now()
            }
        });

        // Should fail without valid signature (401/403) or be rate limited (429)
        expect([401, 403, 429]).toContain(response.status());
    });

    test('admin transactions endpoint should require authentication', async ({ request }) => {
        const response = await request.post('/api/admin/transactions', {
            data: {
                address: '0x0000000000000000000000000000000000000000',
                signature: 'invalid-sig',
                timestamp: Date.now()
            }
        });
        // Should fail without valid signature (401/403) or be rate limited (429)
        expect([401, 403, 429]).toContain(response.status());
    });
});

test.describe('Payment Flow', () => {
    test('solve endpoint should validate required fields', async ({ request }) => {
        const response = await request.post('/api/solve', {
            data: {}
        });

        // Should fail - either validation error (400) or rate limited (429)
        expect([400, 429]).toContain(response.status());
    });

    test('solve endpoint should reject invalid data', async ({ request }) => {
        const response = await request.post('/api/solve', {
            data: {
                problemStatement: 'test',
                txHash: '0xinvalidhash',
                tier: 'standard'
            }
        });

        // Should fail - validation, payment, or rate limit
        expect(response.ok()).toBeFalsy();
    });
});

test.describe('Session Management', () => {
    test('session endpoint should require address', async ({ request }) => {
        const response = await request.post('/api/session', {
            data: {
                signature: 'test',
                timestamp: Date.now()
            }
        });

        // Should fail - missing address (400) or rate limited (429)
        expect(response.ok()).toBeFalsy();
    });

    test('solve endpoint should require active session', async ({ request }) => {
        const response = await request.post('/api/solve', {
            data: {
                address: '0x1234567890123456789012345678901234567890',
                signature: 'test-sig',
                timestamp: Date.now(),
                problem: 'How do I solve this problem?',
                tier: 'standard'
            }
        });

        // Should fail without valid session
        expect(response.ok()).toBeFalsy();
    });
});

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

        // Should fail without valid signature
        expect(response.status()).toBe(403);
    });

    test('admin transactions endpoint should require authentication', async ({ request }) => {
        const response = await request.post('/api/admin/transactions', {
            data: {
                address: '0x0000000000000000000000000000000000000000',
                signature: 'invalid-sig',
                timestamp: Date.now()
            }
        });

        expect(response.status()).toBe(403);
    });
});

test.describe('Payment Flow', () => {
    test('verify-payment should validate required fields', async ({ request }) => {
        const response = await request.post('/api/verify-payment', {
            data: {}
        });

        expect(response.ok()).toBeFalsy();
        const data = await response.json();
        expect(data).toHaveProperty('error');
    });

    test('verify-payment should reject invalid tx hash', async ({ request }) => {
        const response = await request.post('/api/verify-payment', {
            data: {
                txHash: '0xinvalidhash',
                tier: 'standard',
                senderAddress: '0x0000000000000000000000000000000000000000'
            }
        });

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

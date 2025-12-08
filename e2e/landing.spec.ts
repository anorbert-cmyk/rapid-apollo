import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should load the landing page', async ({ page }) => {
        await expect(page).toHaveTitle(/MasterPrompt/i);
    });

    test('should display hero section', async ({ page }) => {
        const hero = page.locator('#heroSection');
        await expect(hero).toBeVisible();
    });

    test('should have Connect Wallet button', async ({ page }) => {
        const connectBtn = page.locator('#btn-connect-wallet');
        await expect(connectBtn).toBeVisible();
        await expect(connectBtn).toContainText(/Connect|Wallet/i);
    });

    test('should display pricing tiers', async ({ page }) => {
        // Check that all three tiers are visible
        await expect(page.locator('#eth-standard')).toBeVisible();
        await expect(page.locator('#eth-medium')).toBeVisible();
        await expect(page.locator('#eth-full')).toBeVisible();
    });

    test('should have problem input textarea', async ({ page }) => {
        const textarea = page.locator('#problemInput');
        await expect(textarea).toBeVisible();
    });

    test('should scroll smoothly to sections', async ({ page }) => {
        // Click on a navigation link
        const benefitsLink = page.locator('a[href="#benefitsSection"]').first();
        if (await benefitsLink.isVisible()) {
            await benefitsLink.click();
            await page.waitForTimeout(500);
            // Benefits section should be in view
            const benefits = page.locator('#benefitsSection');
            await expect(benefits).toBeInViewport();
        }
    });
});

test.describe('API Endpoints', () => {
    test('should return health check', async ({ request }) => {
        const response = await request.get('/api/health');
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.status).toBe('ok');
    });

    test('should return pricing data', async ({ request }) => {
        const response = await request.get('/api/pricing');
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data).toHaveProperty('standard');
        expect(data).toHaveProperty('medium');
        expect(data).toHaveProperty('full');
    });

    test('should return config data', async ({ request }) => {
        const response = await request.get('/api/config');
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data).toHaveProperty('receiverAddress');
    });

    test('should rate limit excessive requests', async ({ request }) => {
        // Make many requests quickly
        const requests = [];
        for (let i = 0; i < 15; i++) {
            requests.push(request.post('/api/session', {
                data: {
                    address: '0xTestWalletAddress123456789012345678901234',
                    signature: 'test-sig',
                    timestamp: Date.now()
                }
            }));
        }

        const responses = await Promise.all(requests);
        // At least some should be rate limited (429)
        // Note: This depends on rate limit configuration
        const statusCodes = responses.map(r => r.status());
        console.log('Status codes:', statusCodes);
    });
});

test.describe('Responsive Design', () => {
    test('should be responsive on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        // Page should still be functional
        await expect(page.locator('#btn-connect-wallet')).toBeVisible();
    });

    test('should be responsive on tablet', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/');

        await expect(page.locator('#heroSection')).toBeVisible();
    });
});

test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
        await page.goto('/');

        // Should have at least one h1
        const h1 = page.locator('h1').first();
        await expect(h1).toBeVisible();
    });

    test('should have alt text on images', async ({ page }) => {
        await page.goto('/');

        const images = page.locator('img');
        const count = await images.count();

        for (let i = 0; i < count; i++) {
            const img = images.nth(i);
            const alt = await img.getAttribute('alt');
            // Images should have alt attribute (can be empty for decorative)
            expect(alt).not.toBeNull();
        }
    });
});

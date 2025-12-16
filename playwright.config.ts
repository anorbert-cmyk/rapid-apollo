import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 1 : undefined,
    reporter: isCI ? 'github' : 'html',

    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    // In CI, only run chromium to speed up tests and match installed browsers
    projects: isCI ? [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ] : [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
        // Mobile viewports
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 12'] },
        },
    ],

    // Run local server before tests
    webServer: {
        command: 'npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: !isCI,
        timeout: 120000,
        env: {
            NODE_ENV: 'test',
            GEMINI_API_KEY: 'test-key',
            RECEIVER_WALLET_ADDRESS: '0x0000000000000000000000000000000000000000',
            ADMIN_WALLET_ADDRESS: '0x0000000000000000000000000000000000000000',
        },
    },
});


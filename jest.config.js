/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/server.ts' // Exclude entry point
    ],
    coverageDirectory: 'coverage',
    verbose: true,
    // Set required env vars for tests (no real secrets, just placeholders)
    setupFiles: ['<rootDir>/jest.setup.js']
};

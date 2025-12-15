import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'public/**',
            '*.js',
            'jest.config.js',
            'jest.setup.js',
            'eslint.config.mjs'
        ]
    },
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json'
            }
        },
        rules: {
            // TypeScript specific
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-non-null-assertion': 'warn',

            // General best practices
            'no-console': 'off', // We use structured logging
            'prefer-const': 'error',
            'no-var': 'error',
            'eqeqeq': ['error', 'always'],

            // Relaxed rules for existing codebase
            '@typescript-eslint/no-require-imports': 'off',
            'no-useless-escape': 'warn'
        }
    }
);

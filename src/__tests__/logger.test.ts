/**
 * Logger Unit Tests
 */

import { logger } from '../utils/logger';

// Mock console methods
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

describe('Logger', () => {
    let consoleLogs: string[] = [];
    let consoleWarns: string[] = [];
    let consoleErrors: string[] = [];

    beforeEach(() => {
        consoleLogs = [];
        consoleWarns = [];
        consoleErrors = [];

        console.log = (...args: unknown[]) => {
            consoleLogs.push(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '));
        };
        console.warn = (...args: unknown[]) => {
            consoleWarns.push(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '));
        };
        console.error = (...args: unknown[]) => {
            consoleErrors.push(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '));
        };
    });

    afterEach(() => {
        console.log = originalLog;
        console.warn = originalWarn;
        console.error = originalError;
    });

    describe('info', () => {
        it('should log info messages', () => {
            logger.info('Test message');
            expect(consoleLogs.length).toBe(1);
            expect(consoleLogs[0]).toContain('Test message');
        });

        it('should include context in logs', () => {
            logger.info('User action', { userId: 123 });
            expect(consoleLogs[0]).toContain('123');
        });
    });

    describe('error', () => {
        it('should log error messages', () => {
            logger.error('Error occurred');
            expect(consoleErrors.length).toBe(1);
            expect(consoleErrors[0]).toContain('Error occurred');
        });

        it('should include error objects', () => {
            const error = new Error('Test error');
            logger.error('Failed', error);
            expect(consoleErrors[0]).toContain('Failed');
        });
    });

    describe('warn', () => {
        it('should log warning messages', () => {
            logger.warn('Warning issued');
            expect(consoleWarns.length).toBe(1);
            expect(consoleWarns[0]).toContain('Warning issued');
        });
    });

    describe('sanitization', () => {
        it('should redact sensitive data from context', () => {
            logger.info('Auth attempt', { password: 'secret123' });
            expect(consoleLogs[0]).toContain('[REDACTED]');
            expect(consoleLogs[0]).not.toContain('secret123');
        });

        it('should truncate wallet addresses', () => {
            logger.info('Transaction', { walletAddress: '0xa14504ffe5E9A245c9d4079547Fa16fA0A823114' });
            expect(consoleLogs[0]).not.toContain('0xa14504ffe5E9A245c9d4079547Fa16fA0A823114');
            expect(consoleLogs[0]).toContain('0xa145');
        });
    });
});

// ===========================================
// LOGGER - Structured logging for production
// ===========================================

import { config } from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, unknown>;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
}

class Logger {
    private isProduction: boolean;

    constructor() {
        this.isProduction = config.NODE_ENV === 'production';
    }

    private formatLog(entry: LogEntry): string {
        if (this.isProduction) {
            // JSON format for production (easy to parse by log aggregators)
            return JSON.stringify(entry);
        }
        // Pretty format for development
        const contextStr = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
        const errorStr = entry.error ? ` | Error: ${entry.error.message}` : '';
        return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}${errorStr}`;
    }

    private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: context ? this.sanitizeContext(context) : undefined,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: this.isProduction ? undefined : error.stack
            } : undefined
        };

        const formatted = this.formatLog(entry);

        switch (level) {
            case 'debug':
                if (!this.isProduction) console.log(formatted);
                break;
            case 'info':
                console.log(formatted);
                break;
            case 'warn':
                console.warn(formatted);
                break;
            case 'error':
                console.error(formatted);
                break;
        }
    }

    // Sanitize sensitive data from logs
    private sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
        const sanitized = { ...context };
        const sensitiveKeys = ['password', 'secret', 'apiKey', 'privateKey', 'signature', 'token'];

        for (const key of Object.keys(sanitized)) {
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
                sanitized[key] = '[REDACTED]';
            }
            // Truncate wallet addresses for privacy
            if (key.toLowerCase().includes('address') || key.toLowerCase().includes('wallet')) {
                const val = sanitized[key];
                if (typeof val === 'string' && val.length > 10) {
                    sanitized[key] = `${val.substring(0, 6)}...${val.substring(val.length - 4)}`;
                }
            }
        }
        return sanitized;
    }

    debug(message: string, context?: Record<string, unknown>): void {
        this.log('debug', message, context);
    }

    info(message: string, context?: Record<string, unknown>): void {
        this.log('info', message, context);
    }

    warn(message: string, context?: Record<string, unknown>): void {
        this.log('warn', message, context);
    }

    error(message: string, error?: Error, context?: Record<string, unknown>): void {
        this.log('error', message, context, error);
    }
}

export const logger = new Logger();

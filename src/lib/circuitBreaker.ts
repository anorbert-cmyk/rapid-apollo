// ===========================================
// CIRCUIT BREAKER - Perplexity API Resilience
// ===========================================

import { logger } from '../utils/logger';
import { CONSTANTS } from '../constants';

/**
 * Circuit breaker states
 */
export enum CircuitState {
    CLOSED = 'CLOSED',   // Normal operation, requests allowed
    OPEN = 'OPEN',       // Failures exceeded threshold, requests blocked
    HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

/**
 * Error classification for circuit breaker
 */
export interface CircuitError {
    isTransient: boolean;  // Can be retried
    isRateLimited: boolean; // API rate limit hit
    isFatal: boolean;       // Should not retry (invalid key, etc)
}

/**
 * Circuit breaker state
 */
interface CircuitBreakerState {
    state: CircuitState;
    failureCount: number;
    lastFailureTime: number;
    lastSuccessTime: number;
    openedAt: number;
}

/**
 * Circuit Breaker implementation for external API calls
 * Prevents cascading failures when the API is down
 */
export class CircuitBreaker {
    private state: CircuitBreakerState;
    private readonly name: string;
    private readonly failureThreshold: number;
    private readonly cooldownMs: number;

    constructor(
        name: string,
        failureThreshold: number = CONSTANTS.CIRCUIT_BREAKER_FAILURE_THRESHOLD,
        cooldownMs: number = CONSTANTS.CIRCUIT_BREAKER_COOLDOWN_MS
    ) {
        this.name = name;
        this.failureThreshold = failureThreshold;
        this.cooldownMs = cooldownMs;
        this.state = {
            state: CircuitState.CLOSED,
            failureCount: 0,
            lastFailureTime: 0,
            lastSuccessTime: Date.now(),
            openedAt: 0
        };
    }

    /**
     * Check if the circuit allows requests
     */
    public isAllowed(): boolean {
        this.evaluateState();
        return this.state.state !== CircuitState.OPEN;
    }

    /**
     * Get current circuit state
     */
    public getState(): CircuitState {
        this.evaluateState();
        return this.state.state;
    }

    /**
     * Record a successful request
     */
    public recordSuccess(): void {
        this.state.failureCount = 0;
        this.state.lastSuccessTime = Date.now();

        if (this.state.state === CircuitState.HALF_OPEN) {
            this.state.state = CircuitState.CLOSED;
            logger.info('Circuit breaker closed (recovered)', { name: this.name });
        }
    }

    /**
     * Record a failed request
     */
    public recordFailure(error: CircuitError): void {
        // Fatal errors don't contribute to circuit breaker
        if (error.isFatal) {
            logger.warn('Circuit breaker: fatal error (not counted)', {
                name: this.name,
                error: 'Fatal error - will not trigger circuit'
            });
            return;
        }

        this.state.failureCount++;
        this.state.lastFailureTime = Date.now();

        logger.warn('Circuit breaker: failure recorded', {
            name: this.name,
            failureCount: this.state.failureCount,
            threshold: this.failureThreshold
        });

        // Rate limit errors should open circuit immediately
        if (error.isRateLimited) {
            this.openCircuit();
            return;
        }

        // Check if we should open the circuit
        if (this.state.failureCount >= this.failureThreshold) {
            this.openCircuit();
        }
    }

    /**
     * Classify an error for circuit breaker decisions
     */
    public static classifyError(error: any): CircuitError {
        const status = error?.status || error?.response?.status;
        const message = error?.message?.toLowerCase() || '';

        // Rate limited
        if (status === 429 || message.includes('rate limit')) {
            return { isTransient: true, isRateLimited: true, isFatal: false };
        }

        // Authentication/Authorization errors - fatal, don't retry
        if (status === 401 || status === 403 || message.includes('invalid api key')) {
            return { isTransient: false, isRateLimited: false, isFatal: true };
        }

        // Server errors - transient
        if (status >= 500 || message.includes('timeout') || message.includes('network')) {
            return { isTransient: true, isRateLimited: false, isFatal: false };
        }

        // Request errors (400, 422) - not transient, but not fatal
        if (status >= 400 && status < 500) {
            return { isTransient: false, isRateLimited: false, isFatal: false };
        }

        // Default: treat as transient
        return { isTransient: true, isRateLimited: false, isFatal: false };
    }

    /**
     * Execute a function with circuit breaker protection
     */
    public async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (!this.isAllowed()) {
            const error = new Error(`Circuit breaker is OPEN for ${this.name}`);
            (error as any).circuitOpen = true;
            throw error;
        }

        try {
            const result = await fn();
            this.recordSuccess();
            return result;
        } catch (error: any) {
            const classified = CircuitBreaker.classifyError(error);
            this.recordFailure(classified);
            throw error;
        }
    }

    /**
     * Get circuit breaker metrics
     */
    public getMetrics(): {
        name: string;
        state: CircuitState;
        failureCount: number;
        lastFailureTime: string | null;
        lastSuccessTime: string;
        openedAt: string | null;
    } {
        return {
            name: this.name,
            state: this.state.state,
            failureCount: this.state.failureCount,
            lastFailureTime: this.state.lastFailureTime
                ? new Date(this.state.lastFailureTime).toISOString()
                : null,
            lastSuccessTime: new Date(this.state.lastSuccessTime).toISOString(),
            openedAt: this.state.openedAt
                ? new Date(this.state.openedAt).toISOString()
                : null
        };
    }

    /**
     * Force reset the circuit (for testing/admin)
     */
    public reset(): void {
        this.state = {
            state: CircuitState.CLOSED,
            failureCount: 0,
            lastFailureTime: 0,
            lastSuccessTime: Date.now(),
            openedAt: 0
        };
        logger.info('Circuit breaker manually reset', { name: this.name });
    }

    // ===========================================
    // PRIVATE METHODS
    // ===========================================

    private openCircuit(): void {
        if (this.state.state !== CircuitState.OPEN) {
            this.state.state = CircuitState.OPEN;
            this.state.openedAt = Date.now();
            logger.error('Circuit breaker OPENED', new Error(`${this.name}: ${this.state.failureCount} failures`));
        }
    }

    private evaluateState(): void {
        if (this.state.state === CircuitState.OPEN) {
            const elapsed = Date.now() - this.state.openedAt;

            if (elapsed >= this.cooldownMs) {
                this.state.state = CircuitState.HALF_OPEN;
                logger.info('Circuit breaker entering HALF_OPEN state', {
                    name: this.name,
                    elapsedMs: elapsed
                });
            }
        }
    }
}

// ===========================================
// SINGLETON INSTANCES
// ===========================================

// Perplexity API circuit breaker
export const perplexityCircuit = new CircuitBreaker('perplexity-api');

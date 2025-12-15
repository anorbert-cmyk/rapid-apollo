// ===========================================
// DATABASE CONNECTION - PostgreSQL Pool
// ===========================================

import { Pool, PoolClient } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

/**
 * Initialize the database connection pool
 */
export function initDatabase(): Pool | null {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        logger.warn('DATABASE_URL not set - using in-memory storage only');
        return null;
    }

    try {
        pool = new Pool({
            connectionString: databaseUrl,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });

        pool.on('error', (err) => {
            logger.error('Unexpected PostgreSQL error', err);
        });

        pool.on('connect', () => {
            logger.debug('New PostgreSQL client connected');
        });

        logger.info('PostgreSQL pool initialized');
        return pool;

    } catch (error) {
        logger.error('Failed to initialize PostgreSQL', error as Error);
        return null;
    }
}

/**
 * Get the database pool instance
 */
export function getPool(): Pool | null {
    return pool;
}

/**
 * Check if database is available
 */
export function isDatabaseAvailable(): boolean {
    return pool !== null;
}

/**
 * Execute a query with automatic client management
 */
export async function query<T = any>(
    text: string,
    params?: any[]
): Promise<T[]> {
    if (!pool) {
        throw new Error('Database not initialized');
    }

    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    logger.debug('Query executed', {
        text: text.slice(0, 50),
        duration,
        rows: result.rowCount
    });

    return result.rows as T[];
}

/**
 * Execute a single query and return first row
 */
export async function queryOne<T = any>(
    text: string,
    params?: any[]
): Promise<T | null> {
    const rows = await query<T>(text, params);
    return rows[0] || null;
}

/**
 * Run database migrations (create tables if not exist)
 */
export async function runMigrations(): Promise<void> {
    if (!pool) {
        logger.warn('Skipping migrations - no database connection');
        return;
    }

    try {
        // Read and execute schema.sql
        const fs = await import('fs');
        const path = await import('path');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        await pool.query(schema);
        logger.info('Database migrations completed');

    } catch (error) {
        logger.error('Migration failed', error as Error);
        throw error;
    }
}

/**
 * Close the database connection pool
 */
export async function closeDatabase(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
        logger.info('PostgreSQL pool closed');
    }
}

/**
 * Execute a callback within a database transaction
 * Automatically commits on success, rollbacks on failure
 * @param callback - Function to execute within the transaction
 * @returns Result of the callback function
 */
export async function withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
): Promise<T> {
    if (!pool) {
        throw new Error('Database not initialized');
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        logger.debug('Transaction started');

        const result = await callback(client);

        await client.query('COMMIT');
        logger.debug('Transaction committed');

        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.warn('Transaction rolled back', { error: (error as Error).message });
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Execute multiple queries atomically
 * @param queries - Array of query objects with text and params
 * @returns Array of results for each query
 */
export async function executeAtomic(
    queries: Array<{ text: string; params?: any[] }>
): Promise<any[]> {
    return withTransaction(async (client) => {
        const results: any[] = [];

        for (const q of queries) {
            const result = await client.query(q.text, q.params);
            results.push(result.rows);
        }

        return results;
    });
}

// Initialize on import if DATABASE_URL is set
if (process.env.DATABASE_URL) {
    initDatabase();
}

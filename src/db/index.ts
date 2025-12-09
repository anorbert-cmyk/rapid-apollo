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

// Initialize on import if DATABASE_URL is set
if (process.env.DATABASE_URL) {
    initDatabase();
}

import Redis from 'ioredis';

// Database Interface
interface IStore<T> {
    get(key: string): Promise<T | null>;
    set(key: string, value: T): Promise<void>;
    has(key: string): Promise<boolean>;
    delete(key: string): Promise<void>;
    setnx(key: string, value: T): Promise<boolean>; // Atomic Set if Not Exists
}

interface StoredResult {
    data: any;
    timestamp: number;
}

// REDIS SETUP (Use if REDIS_URL provided)
let redisClient: Redis | null = null;
if (process.env.REDIS_URL) {
    console.log('🔌 Connecting to Redis...');
    redisClient = new Redis(process.env.REDIS_URL);
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
} else {
    console.log('⚠️ No REDIS_URL found. Using In-Memory Storage (Data lost on restart).');
}

// --- implementations ---

// 1. IN-MEMORY IMPLEMENTATION
class MemoryStore<T> implements IStore<T> {
    private map = new Map<string, T>();

    async get(key: string): Promise<T | null> {
        return this.map.get(key) || null;
    }
    async set(key: string, value: T): Promise<void> {
        this.map.set(key, value);
    }
    async has(key: string): Promise<boolean> {
        return this.map.has(key);
    }
    async delete(key: string): Promise<void> {
        this.map.delete(key);
    }
    async setnx(key: string, value: T): Promise<boolean> {
        if (this.map.has(key)) return false;
        this.map.set(key, value);
        return true;
    }

    // Internal method for cleanup logic (Memory only)
    cleanup(expirationMs: number) {
        const now = Date.now();
        for (const [key, value] of this.map.entries()) {
            const ts = (value as any).timestamp || (value as any as number);
            // Rudimentary check: assumes value has timestamp property OR is a number (timestamp)
            if (ts && (now - ts > expirationMs)) {
                this.map.delete(key);
            }
        }
    }
}

// 2. REDIS IMPLEMENTATION
class RedisStore<T> implements IStore<T> {
    constructor(private prefix: string, private ttlSeconds: number) { }

    async get(key: string): Promise<T | null> {
        const data = await redisClient!.get(`${this.prefix}:${key}`);
        return data ? JSON.parse(data) : null;
    }
    async set(key: string, value: T): Promise<void> {
        // Set with Expiration (TTL) automatically handles cleanup!
        await redisClient!.setex(`${this.prefix}:${key}`, this.ttlSeconds, JSON.stringify(value));
    }
    async has(key: string): Promise<boolean> {
        const exists = await redisClient!.exists(`${this.prefix}:${key}`);
        return exists === 1;
    }
    async delete(key: string): Promise<void> {
        await redisClient!.del(`${this.prefix}:${key}`);
    }
    async setnx(key: string, value: T): Promise<boolean> {
        // Valid for Redis 2.6.12+ (SET key value EX ttl NX)
        // If ttl is 0, we don't set expiration here (or we verify logic)
        // For usedTxHashes we DO want expiration (24h)
        const result = this.ttlSeconds > 0
            ? await redisClient!.set(`${this.prefix}:${key}`, JSON.stringify(value), 'EX', this.ttlSeconds, 'NX')
            : await redisClient!.set(`${this.prefix}:${key}`, JSON.stringify(value), 'NX');

        return result === 'OK';
    }
}

// --- FACTORY ---

const EXPIRATION_SEC = 24 * 60 * 60; // 24 Hours

// Exported Stores
export const resultStore: IStore<StoredResult> = process.env.REDIS_URL
    ? new RedisStore<StoredResult>('res', EXPIRATION_SEC)
    : new MemoryStore<StoredResult>();

export const userHistoryStore: IStore<StoredResult[]> = process.env.REDIS_URL
    ? new RedisStore<StoredResult[]>('history', EXPIRATION_SEC)
    : new MemoryStore<StoredResult[]>();

export const usedTxHashes: IStore<number> = process.env.REDIS_URL
    ? new RedisStore<number>('tx', EXPIRATION_SEC)
    : new MemoryStore<number>();

// Global Stats Store (No Expiration)
export const statsStore: IStore<number> = process.env.REDIS_URL
    ? new RedisStore<number>('stats', 0) // 0 = No Expiration
    : new MemoryStore<number>();

// Share Store: UUID -> txHash mapping
export const shareStore: IStore<string> = process.env.REDIS_URL
    ? new RedisStore<string>('share', EXPIRATION_SEC * 7) // 7 Days expiration for links?
    : new MemoryStore<string>();

// --- CLEANUP (Only needed for Memory) ---
if (!process.env.REDIS_URL) {
    // Explicitly cast to MemoryStore to access the cleanup method
    const memResult = resultStore as unknown as MemoryStore<StoredResult>;
    const memTx = usedTxHashes as unknown as MemoryStore<number>;
    const memShare = shareStore as unknown as MemoryStore<string>;

    setInterval(() => {
        if (memResult.cleanup) memResult.cleanup(EXPIRATION_SEC * 1000);
        if (memTx.cleanup) memTx.cleanup(EXPIRATION_SEC * 1000);
        if (memShare.cleanup) memShare.cleanup(EXPIRATION_SEC * 7 * 1000);
    }, 60 * 60 * 1000); // Hourly
}

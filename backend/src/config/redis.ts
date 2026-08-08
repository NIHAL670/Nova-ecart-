/**
 * Redis client (ioredis). Optional — controlled by REDIS_ENABLED.
 *
 * Used for:
 *  - API response caching (product listings, analytics)
 *  - Session blacklist / JWT refresh-token storage (optional hardened flow)
 *  - Rate-limit persistence across restarts
 */
import Redis from 'ioredis';
import { env } from './env';

const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  enableOfflineQueue: false,
  retryStrategy: (times) => (times > 10 ? null : Math.min(times * 200, 2000)),
});

redis.on('connect', () => {
  // eslint-disable-next-line no-console
  console.log('⚡ Redis connected');
});
redis.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.warn('⚠️ Redis error (non-fatal):', err.message);
});

export async function connectRedis(): Promise<void> {
  if (!env.REDIS_ENABLED) return;
  try {
    await redis.connect();
  } catch {
    // Cache layer is optional — never crash the app because Redis is down.
  }
}

/**
 * Small promise wrapper. In tests we may inject a fake cache.
 */
export const cache = {
  get: async (key: string): Promise<string | null> => {
    if (!env.REDIS_ENABLED || redis.status !== 'ready') return null;
    return redis.get(key);
  },
  set: async (key: string, value: string, ttlSeconds = 300): Promise<void> => {
    if (!env.REDIS_ENABLED || redis.status !== 'ready') return;
    await redis.set(key, value, 'EX', ttlSeconds);
  },
  del: async (key: string): Promise<void> => {
    if (!env.REDIS_ENABLED || redis.status !== 'ready') return;
    await redis.del(key);
  },
  delPattern: async (pattern: string): Promise<void> => {
    if (!env.REDIS_ENABLED || redis.status !== 'ready') return;
    const stream = redis.scanStream({ match: pattern, count: 100 });
    const keys: string[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk: string[]) => keys.push(...chunk));
      stream.on('end', () => resolve());
      stream.on('error', reject);
    });
    if (keys.length) await redis.del(...keys);
  },
};

export default redis;

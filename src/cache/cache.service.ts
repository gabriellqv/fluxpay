import { logger } from '../config/logger';
import { redisConnection } from '../config/redis';

/**
 * Simple cache-aside service wrapping Redis operations.
 *
 * All methods gracefully degrade when Redis is unavailable (returns null/void)
 * so the application remains functional without a cache.
 *
 * Values are serialized as JSON strings for storage and parsed back on retrieval.
 */
export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    if (!redisConnection) return null;

    try {
      const data = await redisConnection.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      logger.error({ err, key }, 'Cache GET error');
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    if (!redisConnection) return;

    try {
      const serialized = JSON.stringify(value);
      await redisConnection.set(key, serialized, 'EX', ttlSeconds);
    } catch (err) {
      logger.error({ err, key }, 'Cache SET error');
    }
  }

  async del(key: string): Promise<void> {
    if (!redisConnection) return;

    try {
      await redisConnection.del(key);
    } catch (err) {
      logger.error({ err, key }, 'Cache DEL error');
    }
  }

  /**
   * Deletes all keys matching a glob pattern.
   *
   * Uses `KEYS` (not `SCAN`) because the expected key volume is low.
   * For high-cardinality patterns, this should be replaced with `SCAN`
   * to avoid blocking the Redis event loop.
   */
  async delByPattern(pattern: string): Promise<void> {
    if (!redisConnection) return;

    try {
      const keys = await redisConnection.keys(pattern);
      if (keys.length > 0) {
        await redisConnection.del(...keys);
      }
    } catch (err) {
      logger.error({ err, pattern }, 'Cache DEL pattern error');
    }
  }
}

export const cacheService = new CacheService();

import IORedis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

// maxRetriesPerRequest: null is required by BullMQ to handle its own retry logic.
// Without this, ioredis would retry failed commands internally, conflicting with BullMQ's retry strategy.
export const redisConnection = env.REDIS_URL
  ? new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    })
  : null;

if (redisConnection) {
  redisConnection.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redisConnection.on('error', (err) => {
    logger.error({ err }, 'Redis connection error');
  });
}

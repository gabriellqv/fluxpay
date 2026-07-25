import IORedis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

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

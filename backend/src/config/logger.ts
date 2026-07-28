import pino from 'pino';
import pinoHttp from 'pino-http';
import { env } from './env';

// Pino is configured with pino-pretty in development for human-readable logs.
// In test mode, logging is silenced to keep test output clean.
// In production, raw JSON output is used for log aggregation systems.
export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

// HTTP request logger middleware. Disabled in test mode to avoid
// polluting test output with request logs.
export const httpLogger = pinoHttp({
  logger,
  autoLogging: env.NODE_ENV !== 'test',
});

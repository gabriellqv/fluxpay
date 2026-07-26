import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/prisma';
import { redisConnection } from './config/redis';
import { transferNotificationWorker } from './jobs/workers/transfer-notification.worker';

const server = app.listen(env.PORT, () => {
  console.log(`Server running on port: ${env.PORT}`);
});

/**
 * Graceful shutdown handler.
 *
 * Closes resources in order: HTTP server, BullMQ worker, Redis, Prisma.
 * A 10-second timeout forces process exit if graceful shutdown hangs,
 * preventing the process from staying alive indefinitely in container
 * orchestration environments (Docker, Kubernetes).
 */
async function shutdown() {
  console.log('Shutting down gracefully...');

  server.close(async () => {
    if (transferNotificationWorker) {
      await transferNotificationWorker.close();
      logger.info('Transfer notification worker closed');
    }

    if (redisConnection) {
      await redisConnection.quit();
      logger.info('Redis connection closed');
    }

    await prisma.$disconnect();
    console.log('Server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forcing shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

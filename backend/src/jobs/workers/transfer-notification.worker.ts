import { Worker } from 'bullmq';
import { logger } from '../../config/logger';
import { redisConnection } from '../../config/redis';
import { processTransferNotification } from '../processors/transfer-notification.processor';
import { TransferNotificationJobData } from '../queues/transfer-notification.queue';

/**
 * BullMQ worker that processes jobs from the transfer-notification queue.
 *
 * Concurrency is set to 5, meaning up to 5 notification creation jobs
 * can run in parallel. This is sufficient for the expected throughput
 * of a wallet application.
 *
 * Returns null when Redis is unavailable so the application can start
 * without a worker.
 */
export const transferNotificationWorker = redisConnection
  ? new Worker<TransferNotificationJobData>('transfer-notification', processTransferNotification, {
      connection: redisConnection,
      concurrency: 5,
    })
  : null;

if (transferNotificationWorker) {
  transferNotificationWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Transfer notification job completed');
  });

  transferNotificationWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Transfer notification job failed');
  });
}

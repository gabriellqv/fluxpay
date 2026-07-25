import { Worker } from 'bullmq';
import { logger } from '../../config/logger';
import { redisConnection } from '../../config/redis';
import { processTransferNotification } from '../processors/transfer-notification.processor';
import { TransferNotificationJobData } from '../queues/transfer-notification.queue';

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

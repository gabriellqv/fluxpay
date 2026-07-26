import { Queue } from 'bullmq';
import { redisConnection } from '../../config/redis';

export interface TransferNotificationJobData {
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  amount: number;
  transactionId: string;
}

/**
 * BullMQ queue for transfer notification jobs.
 *
 * Retry configuration:
 * - 3 attempts with exponential backoff starting at 2 seconds.
 * - Keeps the last 100 completed and 50 failed jobs for inspection.
 *
 * Returns null when Redis is unavailable so the application can start
 * without a queue (notifications are best-effort, not critical path).
 */
export const transferNotificationQueue = redisConnection
  ? new Queue<TransferNotificationJobData>('transfer-notification', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    })
  : null;

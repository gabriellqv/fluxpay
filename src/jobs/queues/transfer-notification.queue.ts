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

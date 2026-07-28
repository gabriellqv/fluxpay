import { Job } from 'bullmq';
import { logger } from '../../config/logger';
import { prisma } from '../../config/prisma';
import { TransferNotificationJobData } from '../queues/transfer-notification.queue';

/**
 * Processes a transfer notification job by creating a Notification record
 * in the database for the receiver.
 *
 * The notification message is formatted in Portuguese because the
 * application's target audience is Brazilian users.
 */
export async function processTransferNotification(
  job: Job<TransferNotificationJobData>,
): Promise<void> {
  const { receiverId, senderName, amount, transactionId } = job.data;

  logger.info({ jobId: job.id, transactionId }, 'Processing transfer notification job');

  await prisma.notification.create({
    data: {
      userId: receiverId,
      transactionId,
      message: `Você recebeu R$ ${amount.toFixed(2)} de ${senderName}`,
      read: false,
    },
  });

  logger.info(
    { jobId: job.id, transactionId, receiverId },
    'Transfer notification created successfully',
  );
}

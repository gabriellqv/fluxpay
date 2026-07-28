import { Prisma } from '@prisma/client';
import { cacheService } from '../../cache/cache.service';
import { cacheKeys } from '../../cache/keys';
import { logger } from '../../config/logger';
import { AppError } from '../../errors/AppError';
import { transferNotificationQueue } from '../../jobs/queues/transfer-notification.queue';
import { IUsersRepository } from '../users/users.repository.interface';
import { CreateTransactionDTO, GetTransactionHistoryQueryDTO } from './transactions.dtos';
import { ITransactionsRepository } from './transactions.repository.interface';

export interface FormattedTransaction {
  id: string;
  amount: Prisma.Decimal;
  type: string;
  createdAt: Date;
  counterparty: { id: string; name: string; email: string };
}

export interface GetTransactionHistoryResult {
  data: FormattedTransaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class TransactionsService {
  constructor(
    private transactionsRepository: ITransactionsRepository,
    private usersRepository: IUsersRepository,
  ) {}

  /**
   * Creates a money transfer between two users.
   *
   * Validation order matters: self-transfer is checked first (cheapest),
   * then sender/receiver existence (parallel lookup), then balance.
   *
   * The actual balance update and transaction creation happen inside a
   * single Prisma interactive transaction to guarantee atomicity.
   *
   * After the transfer succeeds:
   * - Both users' balance caches are invalidated.
   * - Both users' transaction history caches are invalidated (pattern-based).
   * - A BullMQ job is enqueued to create a notification for the receiver.
   *   If the queue is unavailable or the enqueue fails, the transfer still
   *   succeeds — notifications are best-effort, not critical path.
   */
  async create({ senderId, receiverId, amount }: CreateTransactionDTO) {
    if (senderId === receiverId) {
      throw new AppError('Não é possível transferir para você mesmo.', 400, 'SAME_USER_TRANSFER');
    }
    const [sender, receiver] = await Promise.all([
      this.usersRepository.findById(senderId),
      this.usersRepository.findById(receiverId),
    ]);

    if (!sender) {
      throw new AppError('Remetente não encontrado', 404, 'SENDER_NOT_FOUND');
    }

    if (!receiver) {
      throw new AppError('Destinatário não encontrado', 404, 'RECEIVER_NOT_FOUND');
    }

    if (sender.balance.lessThan(amount)) {
      throw new AppError('Saldo insuficiente', 400, 'INSUFFICIENT_FUNDS');
    }

    const transaction = await this.transactionsRepository.create({
      senderId,
      receiverId,
      amount,
    });

    await Promise.all([
      cacheService.del(cacheKeys.userProfile(senderId)),
      cacheService.del(cacheKeys.userProfile(receiverId)),
      cacheService.delByPattern(cacheKeys.userHistoryPattern(senderId)),
      cacheService.delByPattern(cacheKeys.userHistoryPattern(receiverId)),
    ]);

    if (transferNotificationQueue) {
      try {
        await transferNotificationQueue.add(
          'notify-receiver',
          {
            senderId,
            senderName: sender.name,
            receiverId,
            receiverName: receiver.name,
            amount,
            transactionId: transaction.id,
          },
          {
            // Using the transaction ID in the job ID ensures idempotency:
            // if the same transfer is somehow enqueued twice, BullMQ
            // deduplicates by job ID.
            jobId: `notify-receiver:${transaction.id}`,
          },
        );
      } catch (err) {
        logger.error({ err, transactionId: transaction.id }, 'Failed to enqueue notification job');
      }
    }

    return transaction;
  }

  /**
   * Returns paginated transaction history for a user.
   *
   * Each transaction is classified as SENT or RECEIVED relative to the
   * requesting user, and the counterparty (the other party) is resolved
   * accordingly.
   *
   * Results are cached with a 30-second TTL. The cache is invalidated
   * by pattern whenever a new transaction is created for the user.
   */
  async getHistory(
    userId: string,
    query: GetTransactionHistoryQueryDTO,
  ): Promise<GetTransactionHistoryResult> {
    const { page, limit } = query;
    const cacheKey = cacheKeys.userHistory(userId, page, limit);

    const cachedHistory = await cacheService.get<GetTransactionHistoryResult>(cacheKey);
    if (cachedHistory) {
      return cachedHistory;
    }

    const { transactions, total } = await this.transactionsRepository.findHistoryByUserId(
      userId,
      page,
      limit,
    );

    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.senderId === userId ? 'SENT' : 'RECEIVED',
      createdAt: t.createdAt,
      counterparty: t.senderId === userId ? t.receiver : t.sender,
    }));

    const result = {
      data: formattedTransactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await cacheService.set(cacheKey, result, 30);

    return result;
  }
}

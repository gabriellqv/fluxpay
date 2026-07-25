import { logger } from '../../config/logger';
import { AppError } from '../../errors/AppError';
import { transferNotificationQueue } from '../../jobs/queues/transfer-notification.queue';
import { IUsersRepository } from '../users/users.repository.interface';
import { CreateTransactionDTO, GetTransactionHistoryQueryDTO } from './transactions.dtos';
import { ITransactionsRepository } from './transactions.repository.interface';

export class TransactionsService {
  constructor(
    private transactionsRepository: ITransactionsRepository,
    private usersRepository: IUsersRepository,
  ) {}

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

    if (Number(sender.balance) < amount) {
      throw new AppError('Saldo insuficiente', 400, 'INSUFFICIENT_FUNDS');
    }

    const transaction = await this.transactionsRepository.create({
      senderId,
      receiverId,
      amount,
    });

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
            jobId: `notify-receiver:${transaction.id}`,
          },
        );
      } catch (err) {
        logger.error({ err, transactionId: transaction.id }, 'Failed to enqueue notification job');
      }
    }

    return transaction;
  }

  async getHistory(userId: string, query: GetTransactionHistoryQueryDTO) {
    const { page, limit } = query;
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

    return {
      data: formattedTransactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

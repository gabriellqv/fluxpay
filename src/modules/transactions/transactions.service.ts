import { AppError } from '../../errors/AppError';
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
      throw new AppError('Não é possível transferir para você mesmo.', 400);
    }
    const [sender, receiver] = await Promise.all([
      this.usersRepository.findById(senderId),
      this.usersRepository.findById(receiverId),
    ]);

    if (!sender) {
      throw new AppError('Remetente não encontrado', 404);
    }

    if (!receiver) {
      throw new AppError('Destinatário não encontrado', 404);
    }

    if (Number(sender.balance) < amount) {
      throw new AppError('Saldo insuficiente', 400);
    }

    const transaction = await this.transactionsRepository.create({ senderId, receiverId, amount });
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

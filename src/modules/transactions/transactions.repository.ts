import { prisma, Transaction } from '../../config/prisma';
import { CreateTransactionDTO } from './transactions.dtos';
import { ITransactionsRepository } from './transactions.repository.interface';

export class TransactionsRepository implements ITransactionsRepository {
  async create(data: CreateTransactionDTO): Promise<Transaction> {
    return prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: data.senderId },
        data: {
          balance: { decrement: data.amount },
        },
      });

      await tx.user.update({
        where: { id: data.receiverId },
        data: {
          balance: { increment: data.amount },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          amount: data.amount,
          senderId: data.senderId,
          receiverId: data.receiverId,
        },
      });

      return transaction;
    });
  }
}

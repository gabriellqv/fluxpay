import { Transaction } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { CreateTransactionDTO } from './transactions.dtos';
import { ITransactionsRepository } from './transactions.repository.interface';

export class TransactionsRepository implements ITransactionsRepository {
  /**
   * Creates a transaction atomically using a Prisma interactive transaction.
   *
   * The three operations (decrement sender, increment receiver, create record)
   * run inside a single database transaction. If any step fails, all changes
   * are rolled back, ensuring balance consistency.
   *
   * The balance update uses Prisma's atomic `decrement`/`increment` operations
   * rather than reading and writing the balance manually, which would be
   * vulnerable to race conditions.
   */
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

  async findHistoryByUserId(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const whereCondition = {
      OR: [{ senderId: userId }, { receiverId: userId }],
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, name: true, email: true } },
          receiver: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.transaction.count({ where: whereCondition }),
    ]);

    return { transactions, total };
  }
}

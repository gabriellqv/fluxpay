import { Transaction } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../errors/AppError';
import { CreateTransactionDTO } from './transactions.dtos';
import { ITransactionsRepository } from './transactions.repository.interface';

export class TransactionsRepository implements ITransactionsRepository {
  /**
   * Creates a transaction atomically using a Prisma interactive transaction.
   *
   * Three things happen inside the same transaction:
   * 1. Both user rows are locked in ascending id order.
   * 2. The sender's balance is debited with a conditional `updateMany`
   *    (`balance >= amount`), so the check and the write are one atomic
   *    operation at the database level.
   * 3. The receiver is credited and the transaction row is created.
   *
   * Why the deterministic lock order: two concurrent transfers between the
   * same pair of users (A→B and B→A) would otherwise lock the two rows in
   * opposite orders and PostgreSQL would abort one of them with a deadlock
   * (`40P01`). Taking the locks in ascending id order serialises both
   * transfers in the same direction.
   *
   * Why the conditional debit: checking the balance in the service layer is
   * only a fast path. Two requests can read the same balance before either
   * writes, so the authoritative check must live in the same statement that
   * mutates the row. If the debit matches zero rows, the sender did not have
   * enough funds and the whole transaction is rolled back.
   *
   * The `CHECK ("balance" >= 0)` constraint added in the migration is the
   * final safety net if a future code path bypasses this method.
   */
  async create(data: CreateTransactionDTO): Promise<Transaction> {
    return prisma.$transaction(async (tx) => {
      const lockedIds = [data.senderId, data.receiverId].sort();

      for (const id of lockedIds) {
        // Parameterised query: Prisma escapes `id` and sends it as $1.
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${id} FOR UPDATE`;
      }

      const debit = await tx.user.updateMany({
        where: {
          id: data.senderId,
          balance: { gte: data.amount },
        },
        data: {
          balance: { decrement: data.amount },
        },
      });

      if (debit.count !== 1) {
        throw new AppError('Saldo insuficiente', 400, 'INSUFFICIENT_FUNDS');
      }

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

  async findById(id: string) {
    return prisma.transaction.findUnique({
      where: { id },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findHistoryByUserId(
    userId: string,
    page: number,
    limit: number,
    type?: 'SENT' | 'RECEIVED',
  ) {
    const skip = (page - 1) * limit;

    let whereCondition;
    if (type === 'SENT') {
      whereCondition = { senderId: userId };
    } else if (type === 'RECEIVED') {
      whereCondition = { receiverId: userId };
    } else {
      whereCondition = {
        OR: [{ senderId: userId }, { receiverId: userId }],
      };
    }

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

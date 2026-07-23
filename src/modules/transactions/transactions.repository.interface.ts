import { Transaction } from '@prisma/client';
import { CreateTransactionDTO } from './transactions.dtos';

export interface TransactionWithUsers extends Transaction {
  sender: { id: string; name: string; email: string };
  receiver: { id: string; name: string; email: string };
}

export interface ITransactionsRepository {
  create(data: CreateTransactionDTO): Promise<Transaction>;
  findHistoryByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ transactions: TransactionWithUsers[]; total: number }>;
}

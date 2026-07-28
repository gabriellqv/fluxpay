import { Transaction } from '@prisma/client';
import { CreateTransactionDTO } from './transactions.dtos';

export interface TransactionWithUsers extends Transaction {
  sender: { id: string; name: string; email: string };
  receiver: { id: string; name: string; email: string };
}

export interface ITransactionsRepository {
  create(data: CreateTransactionDTO): Promise<Transaction>;
  findById(id: string): Promise<TransactionWithUsers | null>;
  findHistoryByUserId(
    userId: string,
    page: number,
    limit: number,
    type?: 'SENT' | 'RECEIVED',
  ): Promise<{ transactions: TransactionWithUsers[]; total: number }>;
}

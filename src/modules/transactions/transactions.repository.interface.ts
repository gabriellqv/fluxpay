import { Transaction } from '@prisma/client';
import { CreateTransactionDTO } from './transactions.dtos';

export interface ITransactionsRepository {
  create(data: CreateTransactionDTO): Promise<Transaction>;
}

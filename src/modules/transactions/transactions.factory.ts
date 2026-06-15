import { UsersRepository } from '../users/users.repository';
import { TransactionsController } from './transactions.controller';
import { TransactionsRepository } from './transactions.repository';
import { TransactionsService } from './transactions.service';

export const makeTransactionsController = () => {
  const repository = new TransactionsRepository();
  const usersRepository = new UsersRepository();
  const service = new TransactionsService(repository, usersRepository);
  const controller = new TransactionsController(service);

  return controller;
};

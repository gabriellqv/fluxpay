import { makeTransactionsController } from './modules/transactions/transactions.factory';
import { makeUsersController } from './modules/users/users.factory';

export const usersController = makeUsersController();
export const transactionsController = makeTransactionsController();

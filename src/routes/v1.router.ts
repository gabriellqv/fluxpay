import { Router } from 'express';
import { sensitiveRateLimiter } from '../middlewares/rateLimiter';
import { authRoutes } from '../modules/auth/auth.routes';
import { transactionsRoutes } from '../modules/transactions/transactions.routes';
import { usersRoutes } from '../modules/users/users.routes';

const v1Router = Router();

v1Router.use('/auth', sensitiveRateLimiter, authRoutes);
v1Router.use('/users', usersRoutes);
v1Router.use('/transactions', sensitiveRateLimiter, transactionsRoutes);

export { v1Router };

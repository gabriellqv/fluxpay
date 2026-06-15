import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import { transactionsRoutes } from './modules/transactions/transactions.routes';
import { usersRoutes } from './modules/users/users.routes';

const app = express();

app.use(express.json());

app.use('/users', usersRoutes);
app.use('/transactions', transactionsRoutes);

app.get(['/', '/health'], (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Flux Pay API is running' });
});

app.use(errorHandler);

export { app };

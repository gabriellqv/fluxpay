import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import { usersRoutes } from './modules/users/users.routes';

const app = express();

app.use(express.json());

// 1. Rotas da Aplicação
app.use('/users', usersRoutes);

app.get(['/', '/health'], (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Flux Pay API is running' });
});

// 2. Middleware de Erro (DEVE ser o último middleware)
app.use(errorHandler);

export { app };

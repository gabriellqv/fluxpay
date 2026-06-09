import express, { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from './errors/AppError';
import { usersRoutes } from './modules/users/users.routes';

const app = express();

app.use(express.json());

app.use('/users', usersRoutes);

app.get(['/', '/health'], (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Flux Pay API is running' });
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'validation_error',
      message: 'Erro de validação nos dados enviados.',
      errors: err.format(),
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
});

export { app };

import express, { NextFunction, Request, Response } from 'express';
import { AppError } from './errors/AppError';

const app = express();

app.use(express.json());

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
  console.error(err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
});

export { app };

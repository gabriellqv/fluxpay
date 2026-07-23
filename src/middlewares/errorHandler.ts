import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
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

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2003') {
      res.status(400).json({
        status: 'error',
        message: 'Não é possível excluir um usuário que possui histórico de transações.',
      });
      return;
    }
  }

  console.error(err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};

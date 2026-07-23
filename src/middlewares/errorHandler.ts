import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { AppError } from '../errors/AppError';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const timestamp = new Date().toISOString();

  if (err instanceof AppError) {
    logger.warn({ err, url: req.url, method: req.method }, err.message);
    res.status(err.statusCode).json({
      status: 'error',
      code: err.code,
      message: err.message,
      timestamp,
    });
    return;
  }

  if (err instanceof ZodError) {
    logger.warn({ err, url: req.url, method: req.method }, 'Erro de validação nos dados enviados.');
    res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Erro de validação nos dados enviados.',
      errors: err.format(),
      timestamp,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2003') {
      logger.warn(
        { err, url: req.url, method: req.method },
        'Violação de chave estrangeira no banco.',
      );
      res.status(400).json({
        status: 'error',
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Não é possível excluir um usuário que possui histórico de transações.',
        timestamp,
      });
      return;
    }
  }

  logger.error({ err, url: req.url, method: req.method }, 'Erro interno no servidor não tratado.');
  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    timestamp,
  });
};

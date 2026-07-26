import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { AppError } from '../errors/AppError';

/**
 * Global Express error handler.
 *
 * Catches all errors thrown in route handlers and middleware, and returns
 * a structured JSON response with a consistent shape:
 *   { status, code, message, timestamp, errors? }
 *
 * Handles three known error types:
 * - AppError: application-level errors with explicit status codes and error codes.
 * - ZodError: validation errors from request body/query parsing.
 * - Prisma P2003: foreign key violations (e.g. deleting a user with transactions).
 *
 * Unknown errors are logged at error level and return a generic 500 response
 * to avoid leaking internal details.
 */
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
    // P2003 is raised when a foreign key constraint is violated.
    // The most common case is attempting to delete a user that has
    // associated transactions (ON DELETE RESTRICT on senderId/receiverId).
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

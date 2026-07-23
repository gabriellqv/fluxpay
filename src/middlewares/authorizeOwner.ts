import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

export function authorizeOwner(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;

  if (!req.userId) {
    throw new AppError('Usuário não autenticado.', 401, 'UNAUTHENTICATED');
  }

  if (req.userId !== id) {
    throw new AppError('Acesso não autorizado a estes dados.', 403, 'FORBIDDEN');
  }

  return next();
}

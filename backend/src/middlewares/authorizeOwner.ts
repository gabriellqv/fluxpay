import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

/**
 * Authorization middleware that ensures the authenticated user can only
 * access their own resources.
 *
 * Compares `req.userId` (set by authMiddleware) with the `:id` route parameter.
 * Returns 401 if the user is not authenticated, 403 if the user is not the
 * resource owner.
 *
 * Must be used after `authMiddleware` in the middleware chain.
 */
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

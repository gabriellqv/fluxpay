import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';

interface TokenPayload {
  sub: string;
  iat: number;
  exp: number;
}

/**
 * JWT authentication middleware.
 *
 * Extracts the Bearer token from the Authorization header, verifies it,
 * and attaches the authenticated user's ID to `req.userId` via the `sub` claim.
 *
 * Throws a 401 AppError for missing, malformed, or invalid/expired tokens.
 * The error handler middleware catches these and returns a structured response.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token de autenticação não informado.', 401, 'MISSING_TOKEN');
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError(
      'Formato de token inválido. Use "Bearer <token>".',
      401,
      'INVALID_TOKEN_FORMAT',
    );
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

    req.userId = decoded.sub;

    return next();
  } catch {
    throw new AppError('Token de autenticação inválido ou expirado.', 401, 'INVALID_TOKEN');
  }
}

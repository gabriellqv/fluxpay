import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';

interface TokenPayload {
  sub: string;
  iat: number;
  exp: number;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token de autenticação não informado.', 401);
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Formato de token inválido. Use "Bearer <token>".', 401);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('Erro interno de configuração de segurança.', 500);
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;

    req.userId = decoded.sub;

    return next();
  } catch {
    throw new AppError('Token de autenticação inválido ou expirado.', 401);
  }
}

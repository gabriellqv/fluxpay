import { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../errors/AppError';
import { authorizeOwner } from './authorizeOwner';

describe('authorizeOwner Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      params: { id: 'user-123' },
      userId: 'user-123',
    };
    res = {};
    next = vi.fn();
  });

  it('should call next() when authenticated user matches route id', () => {
    authorizeOwner(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should throw AppError 401 when req.userId is missing', () => {
    req.userId = undefined;

    expect(() => authorizeOwner(req as Request, res as Response, next)).toThrow(
      new AppError('Usuário não autenticado.', 401, 'UNAUTHENTICATED'),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should throw AppError 403 when req.userId does not match route id', () => {
    req.userId = 'different-user-456';

    expect(() => authorizeOwner(req as Request, res as Response, next)).toThrow(
      new AppError('Acesso não autorizado a estes dados.', 403, 'FORBIDDEN'),
    );
    expect(next).not.toHaveBeenCalled();
  });
});

import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  login: vi.fn(),
} as unknown as AuthService;

describe('AuthController', () => {
  let controller: AuthController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AuthController(mockAuthService);
    req = {
      body: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should authenticate user and return 200 with token', async () => {
    req.body = {
      email: 'john@example.com',
      password: 'password123',
    };

    const mockResponse = {
      token: 'jwt-token',
      user: { id: 'user-1', name: 'John', email: 'john@example.com' },
    };

    vi.mocked(mockAuthService.login).mockResolvedValue(mockResponse as never);

    await controller.login(req as Request, res as Response);

    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'john@example.com',
      password: 'password123',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResponse);
  });
});

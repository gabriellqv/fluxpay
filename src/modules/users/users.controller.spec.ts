import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../errors/AppError';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUsersService = {
  create: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  replace: vi.fn(),
  delete: vi.fn(),
} as unknown as UsersService;

describe('UsersController', () => {
  let controller: UsersController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new UsersController(mockUsersService);
    req = {
      body: {},
      params: {},
      userId: 'user-123',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
    };
  });

  describe('create', () => {
    it('should create user and return 201', async () => {
      req.body = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        cpf: '12345678901',
        password: 'password123',
      };

      const createdUser = { id: 'user-123', ...req.body };
      delete createdUser.password;

      vi.mocked(mockUsersService.create).mockResolvedValue(createdUser as never);

      await controller.create(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdUser);
    });
  });

  describe('getMe', () => {
    it('should return authenticated user profile', async () => {
      const userProfile = { id: 'user-123', name: 'User' };
      vi.mocked(mockUsersService.findById).mockResolvedValue(userProfile as never);

      await controller.getMe(req as Request, res as Response);

      expect(mockUsersService.findById).toHaveBeenCalledWith('user-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(userProfile);
    });

    it('should throw 401 if req.userId is missing', async () => {
      req.userId = undefined;

      await expect(controller.getMe(req as Request, res as Response)).rejects.toThrow(AppError);
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      req.params = { id: 'user-123' };
      const userProfile = { id: 'user-123', name: 'User' };
      vi.mocked(mockUsersService.findById).mockResolvedValue(userProfile as never);

      await controller.findById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(userProfile);
    });
  });

  describe('delete', () => {
    it('should delete user and return 204', async () => {
      req.params = { id: 'user-123' };
      vi.mocked(mockUsersService.delete).mockResolvedValue(undefined);

      await controller.delete(req as Request, res as Response);

      expect(mockUsersService.delete).toHaveBeenCalledWith('user-123');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});

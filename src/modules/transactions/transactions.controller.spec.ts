import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../errors/AppError';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

const mockTransactionsService = {
  create: vi.fn(),
  getHistory: vi.fn(),
  findById: vi.fn(),
} as unknown as TransactionsService;

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new TransactionsController(mockTransactionsService);
    req = {
      body: {},
      query: {},
      params: {},
      userId: '11111111-1111-4111-8111-111111111111',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('create', () => {
    it('should create transaction and return 201', async () => {
      req.body = {
        receiverId: '22222222-2222-4222-8222-222222222222',
        amount: 50,
      };

      const mockTx = { id: 'tx-1', amount: 50 };
      vi.mocked(mockTransactionsService.create).mockResolvedValue(mockTx as never);

      await controller.create(req as Request, res as Response);

      expect(mockTransactionsService.create).toHaveBeenCalledWith({
        senderId: '11111111-1111-4111-8111-111111111111',
        receiverId: '22222222-2222-4222-8222-222222222222',
        amount: 50,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockTx);
    });

    it('should throw 401 if req.userId is missing', async () => {
      req.userId = undefined;

      await expect(controller.create(req as Request, res as Response)).rejects.toThrow(AppError);
    });
  });

  describe('getHistory', () => {
    it('should return transaction history', async () => {
      req.query = { page: '1', limit: '10' };
      const mockHistory = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } };

      vi.mocked(mockTransactionsService.getHistory).mockResolvedValue(mockHistory as never);

      await controller.getHistory(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockHistory);
    });
  });

  describe('findById', () => {
    it('should return transaction by id', async () => {
      req.params = { id: 'tx-123' };
      const mockTx = { id: 'tx-123', amount: 50 };

      vi.mocked(mockTransactionsService.findById).mockResolvedValue(mockTx as never);

      await controller.findById(req as Request, res as Response);

      expect(mockTransactionsService.findById).toHaveBeenCalledWith(
        'tx-123',
        '11111111-1111-4111-8111-111111111111',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTx);
    });
  });
});

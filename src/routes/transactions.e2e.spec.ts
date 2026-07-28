import { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../app';
import { env } from '../config/env';
import { prisma } from '../config/prisma';

vi.mock('../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../cache/cache.service', () => ({
  cacheService: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => undefined),
    del: vi.fn(async () => undefined),
    delByPattern: vi.fn(async () => undefined),
  },
}));

vi.mock('../jobs/queues/transfer-notification.queue', () => ({
  transferNotificationQueue: null,
}));

describe('Transactions E2E', () => {
  const senderId = '11111111-1111-4111-8111-111111111111';
  const receiverId = '22222222-2222-4222-8222-222222222222';
  let token: string;

  beforeEach(() => {
    vi.clearAllMocks();
    token = jwt.sign({ sub: senderId }, env.JWT_SECRET, { expiresIn: '1h' });
  });

  describe('POST /v1/transactions', () => {
    it('should return 401 Unauthorized when no Bearer token is provided', async () => {
      const response = await request(app).post('/v1/transactions').send({
        receiverId,
        amount: 50,
      });

      expect(response.status).toBe(401);
    });

    it('should create transaction successfully when authorized and valid', async () => {
      const sender = {
        id: senderId,
        name: 'Sender User',
        email: 'sender@example.com',
        cpf: '11111111111',
        password: 'hash',
        balance: new Prisma.Decimal(100),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const receiver = {
        id: receiverId,
        name: 'Receiver User',
        email: 'receiver@example.com',
        cpf: '22222222222',
        password: 'hash',
        balance: new Prisma.Decimal(50),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(sender)
        .mockResolvedValueOnce(receiver);

      const createdTx = {
        id: 'tx-uuid-123',
        senderId,
        receiverId,
        amount: new Prisma.Decimal(50),
        createdAt: new Date(),
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        return (callback as (tx: unknown) => unknown)({
          user: {
            update: vi.fn(),
          },
          transaction: {
            create: vi.fn().mockResolvedValue(createdTx),
          },
        });
      });

      const response = await request(app)
        .post('/v1/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          receiverId,
          amount: 50,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 'tx-uuid-123');
    });

    it('should return 400 Bad Request when validation fails (e.g. invalid UUID)', async () => {
      const response = await request(app)
        .post('/v1/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          receiverId: 'invalid-uuid',
          amount: 50,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /v1/transactions/history', () => {
    it('should return paginated transaction history for authenticated user', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          senderId,
          receiverId,
          amount: new Prisma.Decimal(25),
          createdAt: new Date(),
          sender: { id: senderId, name: 'Sender', email: 'sender@example.com' },
          receiver: { id: receiverId, name: 'Receiver', email: 'receiver@example.com' },
        },
      ];

      vi.mocked(prisma.transaction.findMany).mockResolvedValue(mockTransactions as never);
      vi.mocked(prisma.transaction.count).mockResolvedValue(1);

      const response = await request(app)
        .get('/v1/transactions/history?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta.total).toBe(1);
      expect(response.body.data[0]).toHaveProperty('type', 'SENT');
    });
  });
});

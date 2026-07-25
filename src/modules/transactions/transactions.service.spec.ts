import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../errors/AppError';
import { IUsersRepository } from '../users/users.repository.interface';
import { ITransactionsRepository } from './transactions.repository.interface';
import { TransactionsService } from './transactions.service';

vi.mock('../../jobs/queues/transfer-notification.queue', () => ({
  transferNotificationQueue: {
    add: vi.fn(),
  },
}));

vi.mock('../../config/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../cache/cache.service', () => ({
  cacheService: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => undefined),
    del: vi.fn(async () => undefined),
    delByPattern: vi.fn(async () => undefined),
  },
}));

const mockTransactionsRepository: ITransactionsRepository = {
  create: vi.fn(),
  findHistoryByUserId: vi.fn(),
};

const mockUsersRepository: IUsersRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByCpf: vi.fn(),
  findByEmail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  replace: vi.fn(),
  delete: vi.fn(),
};

const makeSender = () => ({
  id: 'sender-id',
  name: 'Silvio',
  email: 'silvio@email.com',
  cpf: '11111111111',
  password: 'hashed',
  balance: new Prisma.Decimal(100),
  createdAt: new Date(),
});

const makeReceiver = () => ({
  id: 'receiver-id',
  name: 'Bob',
  email: 'bob@email.com',
  cpf: '22222222222',
  password: 'hashed',
  balance: new Prisma.Decimal(50),
  createdAt: new Date(),
});

describe('TransactionsService', () => {
  let sut: TransactionsService;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new TransactionsService(mockTransactionsRepository, mockUsersRepository);
  });

  describe('create', () => {
    it('should throw AppError when sender and receiver are the same', async () => {
      await expect(
        sut.create({ senderId: 'same-id', receiverId: 'same-id', amount: 10 }),
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError when sender does not exist', async () => {
      vi.mocked(mockUsersRepository.findById)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeReceiver());

      await expect(
        sut.create({ senderId: 'invalid-id', receiverId: 'receiver-id', amount: 10 }),
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError when receiver does not exist', async () => {
      vi.mocked(mockUsersRepository.findById)
        .mockResolvedValueOnce(makeSender())
        .mockResolvedValueOnce(null);

      await expect(
        sut.create({ senderId: 'sender-id', receiverId: 'invalid-id', amount: 10 }),
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError when sender has insufficient balance', async () => {
      vi.mocked(mockUsersRepository.findById)
        .mockResolvedValueOnce(makeSender())
        .mockResolvedValueOnce(makeReceiver());

      await expect(
        sut.create({ senderId: 'sender-id', receiverId: 'receiver-id', amount: 200 }),
      ).rejects.toThrow(AppError);
    });

    it('should create a transaction when all validations pass', async () => {
      vi.mocked(mockUsersRepository.findById)
        .mockResolvedValueOnce(makeSender())
        .mockResolvedValueOnce(makeReceiver());

      const expectedTransaction = {
        id: 'transaction-id',
        senderId: 'sender-id',
        receiverId: 'receiver-id',
        amount: new Prisma.Decimal(50),
        createdAt: new Date(),
      };

      vi.mocked(mockTransactionsRepository.create).mockResolvedValue(expectedTransaction);

      const result = await sut.create({
        senderId: 'sender-id',
        receiverId: 'receiver-id',
        amount: 50,
      });

      expect(result).toEqual(expectedTransaction);
      expect(mockTransactionsRepository.create).toHaveBeenCalledWith({
        senderId: 'sender-id',
        receiverId: 'receiver-id',
        amount: 50,
      });
    });

    it('should enqueue a notification job after creating a transaction', async () => {
      const { transferNotificationQueue } =
        await import('../../jobs/queues/transfer-notification.queue');

      const sender = makeSender();
      const receiver = makeReceiver();

      vi.mocked(mockUsersRepository.findById)
        .mockResolvedValueOnce(sender)
        .mockResolvedValueOnce(receiver);

      const expectedTransaction = {
        id: 'transaction-id',
        senderId: sender.id,
        receiverId: receiver.id,
        amount: new Prisma.Decimal(50),
        createdAt: new Date(),
      };

      vi.mocked(mockTransactionsRepository.create).mockResolvedValue(expectedTransaction);

      await sut.create({
        senderId: sender.id,
        receiverId: receiver.id,
        amount: 50,
      });

      expect(transferNotificationQueue!.add).toHaveBeenCalledWith(
        'notify-receiver',
        {
          senderId: sender.id,
          senderName: sender.name,
          receiverId: receiver.id,
          receiverName: receiver.name,
          amount: 50,
          transactionId: expectedTransaction.id,
        },
        {
          jobId: `notify-receiver:${expectedTransaction.id}`,
        },
      );
    });

    it('should not throw when notification queue fails', async () => {
      const { transferNotificationQueue } =
        await import('../../jobs/queues/transfer-notification.queue');

      vi.mocked(transferNotificationQueue!.add).mockRejectedValueOnce(
        new Error('Redis connection failed'),
      );

      vi.mocked(mockUsersRepository.findById)
        .mockResolvedValueOnce(makeSender())
        .mockResolvedValueOnce(makeReceiver());

      const expectedTransaction = {
        id: 'transaction-id',
        senderId: 'sender-id',
        receiverId: 'receiver-id',
        amount: new Prisma.Decimal(50),
        createdAt: new Date(),
      };

      vi.mocked(mockTransactionsRepository.create).mockResolvedValue(expectedTransaction);

      const result = await sut.create({
        senderId: 'sender-id',
        receiverId: 'receiver-id',
        amount: 50,
      });

      expect(result).toEqual(expectedTransaction);
    });
  });

  describe('getHistory', () => {
    it('should return formatted transactions with pagination metadata', async () => {
      const sender = makeSender();
      const receiver = makeReceiver();

      vi.mocked(mockTransactionsRepository.findHistoryByUserId).mockResolvedValue({
        transactions: [
          {
            id: 'tx-1',
            amount: new Prisma.Decimal(30),
            createdAt: new Date(),
            senderId: sender.id,
            receiverId: receiver.id,
            sender: { id: sender.id, name: sender.name, email: sender.email },
            receiver: { id: receiver.id, name: receiver.name, email: receiver.email },
          },
        ],
        total: 1,
      });

      const result = await sut.getHistory(sender.id, { page: 1, limit: 10 });

      expect(result.data[0].type).toBe('SENT');
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should mark transaction as RECEIVED when user is the receiver', async () => {
      const sender = makeSender();
      const receiver = makeReceiver();

      vi.mocked(mockTransactionsRepository.findHistoryByUserId).mockResolvedValue({
        transactions: [
          {
            id: 'tx-1',
            amount: new Prisma.Decimal(30),
            createdAt: new Date(),
            senderId: sender.id,
            receiverId: receiver.id,
            sender: { id: sender.id, name: sender.name, email: sender.email },
            receiver: { id: receiver.id, name: receiver.name, email: receiver.email },
          },
        ],
        total: 1,
      });

      const result = await sut.getHistory(receiver.id, { page: 1, limit: 10 });

      expect(result.data[0].type).toBe('RECEIVED');
    });

    it('should set counterparty to receiver when user is the sender', async () => {
      const sender = makeSender();
      const receiver = makeReceiver();

      vi.mocked(mockTransactionsRepository.findHistoryByUserId).mockResolvedValue({
        transactions: [
          {
            id: 'tx-1',
            amount: new Prisma.Decimal(30),
            createdAt: new Date(),
            senderId: sender.id,
            receiverId: receiver.id,
            sender: { id: sender.id, name: sender.name, email: sender.email },
            receiver: { id: receiver.id, name: receiver.name, email: receiver.email },
          },
        ],
        total: 1,
      });

      const result = await sut.getHistory(sender.id, { page: 1, limit: 10 });

      expect(result.data[0].counterparty).toEqual({
        id: receiver.id,
        name: receiver.name,
        email: receiver.email,
      });
    });

    it('should set counterparty to sender when user is the receiver', async () => {
      const sender = makeSender();
      const receiver = makeReceiver();

      vi.mocked(mockTransactionsRepository.findHistoryByUserId).mockResolvedValue({
        transactions: [
          {
            id: 'tx-1',
            amount: new Prisma.Decimal(30),
            createdAt: new Date(),
            senderId: sender.id,
            receiverId: receiver.id,
            sender: { id: sender.id, name: sender.name, email: sender.email },
            receiver: { id: receiver.id, name: receiver.name, email: receiver.email },
          },
        ],
        total: 1,
      });

      const result = await sut.getHistory(receiver.id, { page: 1, limit: 10 });

      expect(result.data[0].counterparty).toEqual({
        id: sender.id,
        name: sender.name,
        email: sender.email,
      });
    });

    it('should calculate totalPages correctly', async () => {
      vi.mocked(mockTransactionsRepository.findHistoryByUserId).mockResolvedValue({
        transactions: [],
        total: 25,
      });

      const result = await sut.getHistory('any-id', { page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.total).toBe(25);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should return empty data when no transactions exist', async () => {
      vi.mocked(mockTransactionsRepository.findHistoryByUserId).mockResolvedValue({
        transactions: [],
        total: 0,
      });

      const result = await sut.getHistory('any-id', { page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should return cached history when available in cache', async () => {
      const { cacheService } = await import('../../cache/cache.service');
      const cachedResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
      vi.mocked(cacheService.get).mockResolvedValueOnce(cachedResult);

      const result = await sut.getHistory('user-id', { page: 1, limit: 10 });

      expect(result).toEqual(cachedResult);
      expect(mockTransactionsRepository.findHistoryByUserId).not.toHaveBeenCalled();
    });
  });
});

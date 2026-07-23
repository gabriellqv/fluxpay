import { Prisma } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { IUsersRepository } from '../users/users.repository.interface';
import { ITransactionsRepository } from './transactions.repository.interface';
import { TransactionsService } from './transactions.service';

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
  });
});

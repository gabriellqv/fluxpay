import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AppError } from '../../errors/AppError';
import { IUsersRepository } from './users.repository.interface';
import { UsersService } from './users.service';

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn(),
  },
}));

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

const makeUser = (overrides = {}) => ({
  id: 'user-id',
  name: 'John Doe',
  email: 'john@email.com',
  cpf: '12345678901',
  password: 'hashed_password',
  balance: new Prisma.Decimal(100),
  createdAt: new Date(),
  ...overrides,
});

describe('UsersService', () => {
  let sut: UsersService;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new UsersService(mockUsersRepository);
  });

  describe('create', () => {
    const input = {
      name: 'John Doe',
      email: 'john@email.com',
      cpf: '12345678901',
      password: 'plaintext123',
    };

    it('should throw AppError when email already exists', async () => {
      vi.mocked(mockUsersRepository.findByEmail).mockResolvedValue(makeUser());

      await expect(sut.create(input)).rejects.toThrow(AppError);
    });

    it('should throw AppError when CPF already exists', async () => {
      vi.mocked(mockUsersRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUsersRepository.findByCpf).mockResolvedValue(makeUser());

      await expect(sut.create(input)).rejects.toThrow(AppError);
    });

    it('should hash the password before saving', async () => {
      vi.mocked(mockUsersRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUsersRepository.findByCpf).mockResolvedValue(null);
      vi.mocked(mockUsersRepository.create).mockResolvedValue(makeUser());

      await sut.create(input);

      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext123', 10);

      expect(mockUsersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed_password' }),
      );
    });

    it('should return user without password field', async () => {
      vi.mocked(mockUsersRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockUsersRepository.findByCpf).mockResolvedValue(null);
      vi.mocked(mockUsersRepository.create).mockResolvedValue(makeUser());

      const result = await sut.create(input);

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('name', 'John Doe');
    });
  });

  describe('findById', () => {
    it('should throw AppError when user does not exist', async () => {
      vi.mocked(mockUsersRepository.findById).mockResolvedValue(null);

      await expect(sut.findById('invalid-id')).rejects.toThrow(AppError);
    });

    it('should return user without password when found', async () => {
      vi.mocked(mockUsersRepository.findById).mockResolvedValue(makeUser());

      const result = await sut.findById('user-id');

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id', 'user-id');
    });
  });

  describe('delete', () => {
    it('should throw AppError when user does not exist', async () => {
      vi.mocked(mockUsersRepository.findById).mockResolvedValue(null);

      await expect(sut.delete('invalid-id')).rejects.toThrow(AppError);
    });

    it('should call repository delete when user exists', async () => {
      vi.mocked(mockUsersRepository.findById).mockResolvedValue(makeUser());

      await sut.delete('user-id');

      expect(mockUsersRepository.delete).toHaveBeenCalledWith('user-id');
    });
  });
});

import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../../errors/AppError';
import { IUsersRepository } from '../users/users.repository.interface';
import { AuthService } from './auth.service';

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('fake-jwt-token'),
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

const makeUser = () => ({
  id: 'user-id',
  name: 'John Doe',
  email: 'john@email.com',
  cpf: '12345678901',
  password: 'hashed_password',
  balance: new Prisma.Decimal(100),
  createdAt: new Date(),
});

describe('AuthService', () => {
  let sut: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new AuthService(mockUsersRepository);
  });

  describe('login', () => {
    const input = { email: 'john@email.com', password: 'plaintext123' };

    it('should throw AppError when email does not exist', async () => {
      vi.mocked(mockUsersRepository.findByEmail).mockResolvedValue(null);

      await expect(sut.login(input)).rejects.toThrow(AppError);
    });

    it('should throw AppError when password is incorrect', async () => {
      vi.mocked(mockUsersRepository.findByEmail).mockResolvedValue(makeUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(sut.login(input)).rejects.toThrow(AppError);
    });

    it('should return token and user without password on success', async () => {
      vi.mocked(mockUsersRepository.findByEmail).mockResolvedValue(makeUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await sut.login(input);

      expect(result.token).toBe('fake-jwt-token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).toHaveProperty('email', 'john@email.com');
    });

    it('should call jwt.sign with correct payload and options', async () => {
      vi.mocked(mockUsersRepository.findByEmail).mockResolvedValue(makeUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await sut.login(input);

      expect(jwt.sign).toHaveBeenCalledWith(
        { name: 'John Doe', email: 'john@email.com' },
        env.JWT_SECRET,
        { subject: 'user-id', expiresIn: env.JWT_EXPIRES_IN },
      );
    });
  });
});

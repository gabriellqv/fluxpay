import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../app';
import { prisma } from '../config/prisma';

vi.mock('../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Auth & Users E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /v1/users', () => {
    it('should register a new user successfully', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'user-uuid-1',
        name: 'Ana Silva',
        email: 'ana@example.com',
        cpf: '12345678901',
        password: '$2b$10$hashedpassword',
        balance: new Prisma.Decimal(100),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app).post('/v1/users').send({
        name: 'Ana Silva',
        email: 'ana@example.com',
        cpf: '12345678901',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 'user-uuid-1');
      expect(response.body).toHaveProperty('email', 'ana@example.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 409 Conflict if email is already in use', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'existing-user',
        name: 'Existing',
        email: 'ana@example.com',
        cpf: '99999999999',
        password: 'hash',
        balance: new Prisma.Decimal(100),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app).post('/v1/users').send({
        name: 'Ana Silva',
        email: 'ana@example.com',
        cpf: '12345678901',
        password: 'password123',
      });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('POST /v1/auth/login', () => {
    it('should authenticate user and return JWT token', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-uuid-1',
        name: 'Ana Silva',
        email: 'ana@example.com',
        cpf: '12345678901',
        password: hashedPassword,
        balance: new Prisma.Decimal(100),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app).post('/v1/auth/login').send({
        email: 'ana@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 Unauthorized for invalid credentials', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const response = await request(app).post('/v1/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });
  });
});

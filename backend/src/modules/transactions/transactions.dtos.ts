import { z } from 'zod';
import { registry } from '../../config/swagger';

export const createTransactionSchema = registry.register(
  'CreateTransaction',
  z.object({
    receiverId: z
      .string()
      .uuid({ message: 'O ID do destinatário (receiverId) deve ser um UUID válido.' })
      .openapi({ example: '987fcdeb-51a2-43d7-9012-345678912000' }),
    amount: z
      .number()
      .positive({ message: 'O valor da transferência deve ser maior que zero.' })
      .openapi({ example: 50.5 }),
  }),
);

export const getTransactionHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  type: z.enum(['SENT', 'RECEIVED']).optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export type GetTransactionHistoryQueryDTO = z.infer<typeof getTransactionHistoryQuerySchema>;

export interface CreateTransactionDTO {
  senderId: string;
  receiverId: string;
  amount: number;
}

export const transactionResponseSchema = registry.register(
  'TransactionResponse',
  z.object({
    id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    senderId: z.string().uuid().openapi({ example: '11111111-1111-4111-8111-111111111111' }),
    receiverId: z.string().uuid().openapi({ example: '22222222-2222-4222-8222-222222222222' }),
    amount: z.number().openapi({ example: 50.0 }),
    createdAt: z.string().or(z.date()).openapi({ example: '2026-07-28T14:00:00.000Z' }),
  }),
);

export const formattedTransactionResponseSchema = registry.register(
  'FormattedTransactionResponse',
  z.object({
    id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    amount: z.number().openapi({ example: 50.0 }),
    type: z.enum(['SENT', 'RECEIVED']).openapi({ example: 'SENT' }),
    createdAt: z.string().or(z.date()).openapi({ example: '2026-07-28T14:00:00.000Z' }),
    counterparty: z.object({
      id: z.string().uuid().openapi({ example: '22222222-2222-4222-8222-222222222222' }),
      name: z.string().openapi({ example: 'Bob Johnson' }),
      email: z.string().email().openapi({ example: 'bob@example.com' }),
    }),
  }),
);

export const transactionHistoryResponseSchema = registry.register(
  'TransactionHistoryResponse',
  z.object({
    data: z.array(formattedTransactionResponseSchema),
    meta: z.object({
      total: z.number().openapi({ example: 15 }),
      page: z.number().openapi({ example: 1 }),
      limit: z.number().openapi({ example: 10 }),
      totalPages: z.number().openapi({ example: 2 }),
    }),
  }),
);

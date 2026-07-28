import { z } from 'zod';
import { registry } from '../../config/swagger';

export const createUserSchema = registry.register(
  'CreateUser',
  z.object({
    name: z
      .string()
      .min(3, 'O nome deve ter no mínimo 3 caracteres!')
      .openapi({ example: 'John Doe' }),
    email: z.string().email('Email Inválido!').openapi({ example: 'john@example.com' }),
    cpf: z
      .string()
      .length(11, 'CPF deve ter exatamente 11 dígitos numéricos')
      .regex(/^\d+$/, 'CPF deve conter apenas números')
      .openapi({ example: '12345678901' }),
    password: z
      .string()
      .min(8, 'A senha deve ter no mínimo 8 caracteres')
      .openapi({ example: 'strongpass123' }),
  }),
);

export type CreateUserDTO = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.partial();
export type UpdateUserDTO = z.infer<typeof updateUserSchema>;

export const replaceUserSchema = createUserSchema;
export type ReplaceUserDTO = z.infer<typeof replaceUserSchema>;

export const userResponseSchema = registry.register(
  'UserResponse',
  z.object({
    id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    name: z.string().openapi({ example: 'John Doe' }),
    email: z.string().email().openapi({ example: 'john@example.com' }),
    cpf: z.string().openapi({ example: '12345678901' }),
    balance: z.number().openapi({ example: 100.0 }),
    createdAt: z.string().or(z.date()).openapi({ example: '2026-07-28T14:00:00.000Z' }),
  }),
);

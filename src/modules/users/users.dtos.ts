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

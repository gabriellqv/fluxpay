import { z } from 'zod';
import { registry } from '../../config/swagger';
import { userResponseSchema } from '../users/users.dtos';

export const loginSchema = z.object({
  email: z.string().email('E-mail em formato inválido.'),
  password: z.string().min(1, 'A senha é obrigatória.'),
});

export type LoginDTO = z.infer<typeof loginSchema>;

export const loginResponseSchema = registry.register(
  'LoginResponse',
  z.object({
    token: z
      .string()
      .openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny...' }),
    user: userResponseSchema,
  }),
);

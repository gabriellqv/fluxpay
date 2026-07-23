import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail em formato inválido.'),
  password: z.string().min(1, 'A senha é obrigatória.'),
});

export type LoginDTO = z.infer<typeof loginSchema>;

import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL deve ser uma URL válida.' }),
  JWT_SECRET: z.string().min(1, { message: 'JWT_SECRET é obrigatório.' }),
  JWT_EXPIRES_IN: z.string().default('1d'),
  REDIS_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().default('*'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Variáveis de ambiente inválidas ou ausentes:');
  console.error(_env.error.format());
  throw new Error('Falha na inicialização do servidor por falta de variáveis de ambiente.');
}

export const env = _env.data;

import { z } from 'zod';
import { registry } from '../../config/swagger';

export const createTransactionSchema = registry.register(
  'CreateTransaction',
  z.object({
    senderId: z
      .string()
      .uuid({ message: 'O ID do remetente (senderId) deve ser um UUID válido.' })
      .openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
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

export type CreateTransactionDTO = z.infer<typeof createTransactionSchema>;

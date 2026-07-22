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

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export interface CreateTransactionDTO {
  senderId: string;
  receiverId: string;
  amount: number;
}

import { z } from 'zod';

export const createTransactionSchema = z.object({
  senderId: z.string().uuid({ message: 'O ID do remetente (senderId) deve ser um UUID válido.' }),

  receiverId: z
    .string()
    .uuid({ message: 'O ID do destinatário (receiverId) deve ser um UUID válido.' }),

  amount: z.number().positive({ message: 'O valor da transferência deve ser maior que zero.' }),
});

export type CreateTransactionDTO = z.infer<typeof createTransactionSchema>;

import { z } from 'zod';
import { registry } from '../../config/swagger';

export const notificationResponseSchema = registry.register(
  'NotificationResponse',
  z.object({
    id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    userId: z.string().uuid().openapi({ example: '11111111-1111-4111-8111-111111111111' }),
    transactionId: z.string().uuid().openapi({ example: 'tx-uuid-123' }),
    message: z.string().openapi({ example: 'Você recebeu R$ 50.00 de Silvio' }),
    read: z.boolean().openapi({ example: false }),
    createdAt: z.string().or(z.date()).openapi({ example: '2026-07-28T14:00:00.000Z' }),
  }),
);

export const unreadCountResponseSchema = registry.register(
  'UnreadCountResponse',
  z.object({
    count: z.number().openapi({ example: 3 }),
  }),
);

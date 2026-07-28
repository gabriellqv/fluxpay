import { Router } from 'express';
import { registry } from '../../config/swagger';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { createTransactionSchema, getTransactionHistoryQuerySchema } from './transactions.dtos';
import { makeTransactionsController } from './transactions.factory';

const transactionsRoutes = Router();
const transactionsController = makeTransactionsController();

registry.registerPath({
  method: 'post',
  path: '/v1/transactions',
  tags: ['Transactions'],
  summary: 'Create a new transaction',
  description: 'Transfers money from one user to another.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createTransactionSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Transaction created successfully',
    },
    400: {
      description: 'Validation error or business rule violation',
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

transactionsRoutes.post('/', authMiddleware, transactionsController.create);

registry.registerPath({
  method: 'get',
  path: '/v1/transactions/history',
  tags: ['Transactions'],
  summary: 'Get user transaction history',
  description: 'Returns paginated list of transactions sent or received by the authenticated user.',
  security: [{ bearerAuth: [] }],
  request: {
    query: getTransactionHistoryQuerySchema,
  },
  responses: {
    200: {
      description: 'Transaction history retrieved successfully',
    },
    401: {
      description: 'Unauthorized',
    },
  },
});

transactionsRoutes.get('/history', authMiddleware, transactionsController.getHistory);

registry.registerPath({
  method: 'get',
  path: '/v1/transactions/{id}',
  tags: ['Transactions'],
  summary: 'Get transaction by ID',
  description:
    'Returns details of a specific transaction. User must be either the sender or receiver.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Transaction details retrieved successfully' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Transaction not found' },
  },
});

transactionsRoutes.get('/:id', authMiddleware, transactionsController.findById);

export { transactionsRoutes };

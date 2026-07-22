import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { transactionsController } from '../../registry';

const transactionsRoutes = Router();

import { registry } from '../../config/swagger';
import { createTransactionSchema } from './transactions.dtos';

registry.registerPath({
  method: 'post',
  path: '/transactions',
  tags: ['Transactions'],
  summary: 'Create a new transaction',
  description: 'Transfers money from one user to another.',
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
  },
});

transactionsRoutes.post('/', authMiddleware, transactionsController.create);

export { transactionsRoutes };

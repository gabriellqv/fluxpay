import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeOwner } from '../../middlewares/authorizeOwner';
import { usersController } from '../../registry';

export const usersRoutes = Router();

import { registry } from '../../config/swagger';
import { createUserSchema } from './users.dtos';

registry.registerPath({
  method: 'post',
  path: '/v1/users',
  tags: ['Users'],
  summary: 'Create a new user',
  description: 'Registers a new user in the system.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User created successfully',
    },
    400: {
      description: 'Validation error',
    },
    409: {
      description: 'Conflict (Email or CPF already exists)',
    },
  },
});

usersRoutes.post('/', usersController.create);
usersRoutes.get('/:id', authMiddleware, authorizeOwner, usersController.findById);
usersRoutes.patch('/:id', authMiddleware, authorizeOwner, usersController.update);
usersRoutes.put('/:id', authMiddleware, authorizeOwner, usersController.replace);
usersRoutes.delete('/:id', authMiddleware, authorizeOwner, usersController.delete);

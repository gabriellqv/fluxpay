import { Router } from 'express';
import { usersController } from '../../registry';

export const usersRoutes = Router();

import { registry } from '../../config/swagger';
import { createUserSchema } from './users.dtos';

registry.registerPath({
  method: 'post',
  path: '/users',
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
usersRoutes.patch('/:id', usersController.update);
usersRoutes.put('/:id', usersController.replace);
usersRoutes.delete('/:id', usersController.delete);
usersRoutes.get('/', usersController.findAll);
usersRoutes.get('/:id', usersController.findById);

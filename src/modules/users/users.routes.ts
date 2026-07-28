import { Router } from 'express';
import { registry } from '../../config/swagger';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authorizeOwner } from '../../middlewares/authorizeOwner';
import {
  createUserSchema,
  replaceUserSchema,
  updateUserSchema,
  userResponseSchema,
} from './users.dtos';
import { makeUsersController } from './users.factory';

export const usersRoutes = Router();
const usersController = makeUsersController();

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
      content: { 'application/json': { schema: userResponseSchema } },
    },
    400: { description: 'Validation error' },
    409: { description: 'Conflict (Email or CPF already exists)' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/users/me',
  tags: ['Users'],
  summary: 'Get authenticated user profile',
  description: 'Returns the profile of the currently authenticated user based on JWT.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'User profile retrieved successfully',
      content: { 'application/json': { schema: userResponseSchema } },
    },
    401: { description: 'Unauthorized' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/users/{id}',
  tags: ['Users'],
  summary: 'Get user by ID',
  description: 'Returns the details of a user by ID. Only the owner can access.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'User retrieved successfully',
      content: { 'application/json': { schema: userResponseSchema } },
    },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden (Not the resource owner)' },
    404: { description: 'User not found' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/v1/users/{id}',
  tags: ['Users'],
  summary: 'Partially update user',
  description: 'Updates specified fields of a user. Only the owner can update.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: updateUserSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'User updated successfully',
      content: { 'application/json': { schema: userResponseSchema } },
    },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'User not found' },
  },
});

registry.registerPath({
  method: 'put',
  path: '/v1/users/{id}',
  tags: ['Users'],
  summary: 'Replace user',
  description: 'Replaces all fields of a user. Only the owner can replace.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: replaceUserSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'User replaced successfully',
      content: { 'application/json': { schema: userResponseSchema } },
    },
    400: { description: 'Validation error' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'User not found' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/v1/users/{id}',
  tags: ['Users'],
  summary: 'Delete user',
  description: 'Deletes a user by ID. Only the owner can delete.',
  security: [{ bearerAuth: [] }],
  responses: {
    204: { description: 'User deleted successfully' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'User not found' },
  },
});

usersRoutes.post('/', usersController.create);
usersRoutes.get('/me', authMiddleware, usersController.getMe);
usersRoutes.get('/:id', authMiddleware, authorizeOwner, usersController.findById);
usersRoutes.patch('/:id', authMiddleware, authorizeOwner, usersController.update);
usersRoutes.put('/:id', authMiddleware, authorizeOwner, usersController.replace);
usersRoutes.delete('/:id', authMiddleware, authorizeOwner, usersController.delete);

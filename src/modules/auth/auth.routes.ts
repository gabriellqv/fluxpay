import { Router } from 'express';
import { registry } from '../../config/swagger';
import { loginResponseSchema, loginSchema } from './auth.dtos';
import { makeAuthController } from './auth.factory';

const authRoutes = Router();
const authController = makeAuthController();

registry.registerPath({
  method: 'post',
  path: '/v1/auth/login',
  tags: ['Auth'],
  summary: 'Authenticate user',
  description: 'Authenticates user with email and password and returns a JWT token.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Authenticated successfully',
      content: { 'application/json': { schema: loginResponseSchema } },
    },
    400: {
      description: 'Validation error',
    },
    401: {
      description: 'Invalid credentials',
    },
  },
});

authRoutes.post('/login', authController.login);

export { authRoutes };

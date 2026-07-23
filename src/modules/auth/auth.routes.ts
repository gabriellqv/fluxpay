import { Router } from 'express';
import { makeAuthController } from './auth.factory';

const authRoutes = Router();
const authController = makeAuthController();

authRoutes.post('/login', authController.login);

export { authRoutes };

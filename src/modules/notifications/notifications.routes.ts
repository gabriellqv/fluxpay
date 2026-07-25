import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { makeNotificationsController } from './notifications.factory';

const notificationsRoutes = Router();
const notificationsController = makeNotificationsController();

notificationsRoutes.get('/', authMiddleware, notificationsController.findByUser);
notificationsRoutes.patch('/:id/read', authMiddleware, notificationsController.markAsRead);

export { notificationsRoutes };

import { Router } from 'express';
import { registry } from '../../config/swagger';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { makeNotificationsController } from './notifications.factory';

const notificationsRoutes = Router();
const notificationsController = makeNotificationsController();

registry.registerPath({
  method: 'get',
  path: '/v1/notifications',
  tags: ['Notifications'],
  summary: 'Get user notifications',
  description: 'Returns all notifications for the authenticated user.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Notifications retrieved successfully' },
    401: { description: 'Unauthorized' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/notifications/unread-count',
  tags: ['Notifications'],
  summary: 'Get unread notification count',
  description: 'Returns the total count of unread notifications for the authenticated user.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Unread count retrieved successfully' },
    401: { description: 'Unauthorized' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/v1/notifications/{id}/read',
  tags: ['Notifications'],
  summary: 'Mark notification as read',
  description: 'Marks a specific notification as read. Only the owner can mark as read.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Notification marked as read' },
    401: { description: 'Unauthorized' },
    404: { description: 'Notification not found' },
  },
});

notificationsRoutes.get('/', authMiddleware, notificationsController.findByUser);
notificationsRoutes.get('/unread-count', authMiddleware, notificationsController.countUnread);
notificationsRoutes.patch('/:id/read', authMiddleware, notificationsController.markAsRead);

export { notificationsRoutes };

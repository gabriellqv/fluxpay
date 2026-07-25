import { Notification } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { INotificationsRepository } from './notifications.repository.interface';

export class NotificationsRepository implements INotificationsRepository {
  async findByUserId(userId: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return null;
    }

    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }
}

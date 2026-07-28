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

  /**
   * Marks a notification as read, but only if it belongs to the given user.
   *
   * Uses `findFirst` with both `id` and `userId` to prevent users from
   * marking another user's notifications as read. Returns null if the
   * notification does not exist or does not belong to the user.
   */
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

  async countUnreadByUserId(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  }
}

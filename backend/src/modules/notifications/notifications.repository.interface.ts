import { Notification } from '@prisma/client';

export interface INotificationsRepository {
  findByUserId(userId: string): Promise<Notification[]>;
  markAsRead(id: string, userId: string): Promise<Notification | null>;
  countUnreadByUserId(userId: string): Promise<number>;
}

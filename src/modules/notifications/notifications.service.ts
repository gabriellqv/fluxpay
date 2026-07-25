import { AppError } from '../../errors/AppError';
import { INotificationsRepository } from './notifications.repository.interface';

export class NotificationsService {
  constructor(private notificationsRepository: INotificationsRepository) {}

  async findByUserId(userId: string) {
    return this.notificationsRepository.findByUserId(userId);
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationsRepository.markAsRead(id, userId);

    if (!notification) {
      throw new AppError('Notificação não encontrada', 404, 'NOTIFICATION_NOT_FOUND');
    }

    return notification;
  }
}

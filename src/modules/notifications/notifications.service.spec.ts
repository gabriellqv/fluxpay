import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../errors/AppError';
import { INotificationsRepository } from './notifications.repository.interface';
import { NotificationsService } from './notifications.service';

const mockNotificationsRepository: INotificationsRepository = {
  findByUserId: vi.fn(),
  markAsRead: vi.fn(),
  countUnreadByUserId: vi.fn(),
};

describe('NotificationsService', () => {
  let sut: NotificationsService;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new NotificationsService(mockNotificationsRepository);
  });

  describe('findByUserId', () => {
    it('should return notifications for the user', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: 'user-1',
          transactionId: 'tx-1',
          message: 'Você recebeu R$ 50.00 de Silvio',
          read: false,
          createdAt: new Date(),
        },
      ];

      vi.mocked(mockNotificationsRepository.findByUserId).mockResolvedValue(mockNotifications);

      const result = await sut.findByUserId('user-1');

      expect(result).toEqual(mockNotifications);
      expect(mockNotificationsRepository.findByUserId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        transactionId: 'tx-1',
        message: 'Você recebeu R$ 50.00 de Silvio',
        read: true,
        createdAt: new Date(),
      };

      vi.mocked(mockNotificationsRepository.markAsRead).mockResolvedValue(mockNotification);

      const result = await sut.markAsRead('notif-1', 'user-1');

      expect(result.read).toBe(true);
      expect(mockNotificationsRepository.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
    });

    it('should throw AppError when notification is not found', async () => {
      vi.mocked(mockNotificationsRepository.markAsRead).mockResolvedValue(null);

      await expect(sut.markAsRead('invalid-id', 'user-1')).rejects.toThrow(AppError);
    });
  });

  describe('countUnread', () => {
    it('should return unread count for user', async () => {
      vi.mocked(mockNotificationsRepository.countUnreadByUserId).mockResolvedValue(3);

      const count = await sut.countUnread('user-1');

      expect(count).toBe(3);
      expect(mockNotificationsRepository.countUnreadByUserId).toHaveBeenCalledWith('user-1');
    });
  });
});

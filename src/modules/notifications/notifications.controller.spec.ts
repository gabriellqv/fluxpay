import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../errors/AppError';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

const mockNotificationsService = {
  findByUserId: vi.fn(),
  markAsRead: vi.fn(),
  countUnread: vi.fn(),
} as unknown as NotificationsService;

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new NotificationsController(mockNotificationsService);
    req = {
      params: {},
      userId: 'user-123',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('findByUser', () => {
    it('should return user notifications', async () => {
      const mockNotifs = [{ id: 'notif-1', message: 'Hello' }];
      vi.mocked(mockNotificationsService.findByUserId).mockResolvedValue(mockNotifs as never);

      await controller.findByUser(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockNotifs);
    });

    it('should throw 401 if req.userId is missing', async () => {
      req.userId = undefined;

      await expect(controller.findByUser(req as Request, res as Response)).rejects.toThrow(
        AppError,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      req.params = { id: 'notif-1' };
      const mockNotif = { id: 'notif-1', read: true };
      vi.mocked(mockNotificationsService.markAsRead).mockResolvedValue(mockNotif as never);

      await controller.markAsRead(req as Request, res as Response);

      expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith('notif-1', 'user-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockNotif);
    });
  });

  describe('countUnread', () => {
    it('should return unread count', async () => {
      vi.mocked(mockNotificationsService.countUnread).mockResolvedValue(5 as never);

      await controller.countUnread(req as Request, res as Response);

      expect(mockNotificationsService.countUnread).toHaveBeenCalledWith('user-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ count: 5 });
    });
  });
});

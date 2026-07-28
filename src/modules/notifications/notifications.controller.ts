import { Request, Response } from 'express';
import { AppError } from '../../errors/AppError';
import { NotificationsService } from './notifications.service';

export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  findByUser = async (req: Request, res: Response) => {
    const userId = req.userId;

    if (!userId) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    const notifications = await this.notificationsService.findByUserId(userId);
    res.status(200).json(notifications);
  };

  markAsRead = async (req: Request, res: Response) => {
    const userId = req.userId;
    const { id } = req.params as { id: string };

    if (!userId) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    const notification = await this.notificationsService.markAsRead(id, userId);
    res.status(200).json(notification);
  };

  countUnread = async (req: Request, res: Response) => {
    const userId = req.userId;

    if (!userId) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    const count = await this.notificationsService.countUnread(userId);
    res.status(200).json({ count });
  };
}

import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

export const makeNotificationsController = () => {
  const repository = new NotificationsRepository();
  const service = new NotificationsService(repository);
  const controller = new NotificationsController(service);

  return controller;
};

import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

export const makeUsersController = () => {
  const repository = new UsersRepository();
  const service = new UsersService(repository);
  const controller = new UsersController(service);

  return controller;
};

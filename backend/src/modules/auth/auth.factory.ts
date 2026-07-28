import { UsersRepository } from '../users/users.repository';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

export function makeAuthController(): AuthController {
  const usersRepository = new UsersRepository();
  const authService = new AuthService(usersRepository);
  return new AuthController(authService);
}

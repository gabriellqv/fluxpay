import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../../errors/AppError';
import { excludePassword } from '../../utils/excludePassword';
import { IUsersRepository } from '../users/users.repository.interface';
import { LoginDTO } from './auth.dtos';

export class AuthService {
  constructor(private usersRepository: IUsersRepository) {}

  async login(data: LoginDTO) {
    const user = await this.usersRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError('E-mail ou senha incorretos.', 401, 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('E-mail ou senha incorretos.', 401, 'INVALID_CREDENTIALS');
    }

    const token = jwt.sign({ name: user.name, email: user.email }, env.JWT_SECRET, {
      subject: user.id,
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const userWithoutPassword = excludePassword(user);

    return {
      token,
      user: userWithoutPassword,
    };
  }
}

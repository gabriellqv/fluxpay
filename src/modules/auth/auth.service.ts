import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '../../errors/AppError';
import { IUsersRepository } from '../users/users.repository.interface';
import { LoginDTO } from './auth.dtos';

export class AuthService {
  constructor(private usersRepository: IUsersRepository) {}

  async login(data: LoginDTO) {
    const user = await this.usersRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError('E-mail ou senha incorretos.', 401);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('E-mail ou senha incorretos.', 401);
    }

    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

    if (!secret) {
      throw new AppError('Erro interno de configuração de segurança.', 500);
    }

    const token = jwt.sign({ name: user.name, email: user.email }, secret, {
      subject: user.id,
      expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    });

    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }
}

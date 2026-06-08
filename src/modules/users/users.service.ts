import bcrypt from 'bcrypt';
import { AppError } from '../../errors/AppError';
import { CreateUserDTO } from './users.dtos';
import { UsersRepository } from './users.repository';

export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async create(data: CreateUserDTO) {
    const userExists = await this.usersRepository.findByEmail(data.email);

    if (userExists) {
      throw new AppError('Este e-mail já está sendo utilizado por outro usuário.', 409);
    }

    const cpfExists = await this.usersRepository.findByCpf(data.cpf);
    if (cpfExists) {
      throw new AppError('Este CPF já está cadastrado no sistema.', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await this.usersRepository.create({
      ...data,
      password: hashedPassword,
    });

    const { password: _, ...usersWithoutPassword } = newUser;
    return usersWithoutPassword;
  }
}

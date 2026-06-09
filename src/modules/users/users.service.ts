import bcrypt from 'bcrypt';
import { AppError } from '../../errors/AppError';
import { CreateUserDTO, ReplaceUserDTO, UpdateUserDTO } from './users.dtos';
import { UsersRepository } from './users.repository';

export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async findAll() {
    const users = await this.usersRepository.findAll();

    return users.map((user) => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new AppError('Este usuário não foi encontrado.', 404);
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByCpf(cpf: string) {
    const user = await this.usersRepository.findByCpf(cpf);
    if (!user) {
      throw new AppError('Este usuário não foi encontrado.', 404);
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByEmail(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Este usuário não foi encontrado.', 404);
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

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

  async update(id: string, data: UpdateUserDTO) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await this.usersRepository.update(id, data);
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async replace(id: string, data: ReplaceUserDTO) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    data.password = await bcrypt.hash(data.password, 10);

    const replacedUser = await this.usersRepository.replace(id, data);
    const { password: _, ...userWithoutPassword } = replacedUser;
    return userWithoutPassword;
  }

  async delete(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    await this.usersRepository.delete(id);
  }
}

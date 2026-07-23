import bcrypt from 'bcrypt';
import { AppError } from '../../errors/AppError';
import { excludePassword } from '../../utils/excludePassword';
import { CreateUserDTO, ReplaceUserDTO, UpdateUserDTO } from './users.dtos';
import { IUsersRepository } from './users.repository.interface';

export class UsersService {
  constructor(private usersRepository: IUsersRepository) {}

  async findAll() {
    const users = await this.usersRepository.findAll();

    return users.map((user) => excludePassword(user));
  }

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new AppError('Este usuário não foi encontrado.', 404);
    }
    return excludePassword(user);
  }

  async findByCpf(cpf: string) {
    const user = await this.usersRepository.findByCpf(cpf);
    if (!user) {
      throw new AppError('Este usuário não foi encontrado.', 404);
    }
    return excludePassword(user);
  }

  async findByEmail(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Este usuário não foi encontrado.', 404);
    }
    return excludePassword(user);
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

    return excludePassword(newUser);
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
    return excludePassword(updatedUser);
  }

  async replace(id: string, data: ReplaceUserDTO) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    data.password = await bcrypt.hash(data.password, 10);

    const replacedUser = await this.usersRepository.replace(id, data);
    return excludePassword(replacedUser);
  }

  async delete(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    await this.usersRepository.delete(id);
  }
}

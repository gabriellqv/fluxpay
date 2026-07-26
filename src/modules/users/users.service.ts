import bcrypt from 'bcrypt';
import { cacheService } from '../../cache/cache.service';
import { cacheKeys } from '../../cache/keys';
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

  /**
   * Finds a user by ID with cache-aside pattern.
   *
   * The cache key is based on the user balance key because the primary
   * use case for caching user data is balance checks during transfers.
   * Cache TTL is 60 seconds — short enough to reflect balance changes
   * from recent transactions without excessive database queries.
   */
  async findById(id: string) {
    const cacheKey = cacheKeys.userBalance(id);
    const cachedUser = await cacheService.get<ReturnType<typeof excludePassword>>(cacheKey);

    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new AppError('Este usuário não foi encontrado.', 404, 'USER_NOT_FOUND');
    }

    const userWithoutPassword = excludePassword(user);
    await cacheService.set(cacheKey, userWithoutPassword, 60);

    return userWithoutPassword;
  }

  async findByCpf(cpf: string) {
    const user = await this.usersRepository.findByCpf(cpf);
    if (!user) {
      throw new AppError('Este usuário não foi encontrado.', 404, 'USER_NOT_FOUND');
    }
    return excludePassword(user);
  }

  async findByEmail(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Este usuário não foi encontrado.', 404, 'USER_NOT_FOUND');
    }
    return excludePassword(user);
  }

  /**
   * Creates a new user after checking for duplicate email and CPF.
   *
   * The password is hashed with bcrypt (cost factor 10) before storage.
   * The default balance of 100.00 is set at the database level (schema default).
   */
  async create(data: CreateUserDTO) {
    const userExists = await this.usersRepository.findByEmail(data.email);

    if (userExists) {
      throw new AppError(
        'Este e-mail já está sendo utilizado por outro usuário.',
        409,
        'EMAIL_ALREADY_EXISTS',
      );
    }

    const cpfExists = await this.usersRepository.findByCpf(data.cpf);
    if (cpfExists) {
      throw new AppError('Este CPF já está cadastrado no sistema.', 409, 'CPF_ALREADY_EXISTS');
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
      throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
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
      throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
    }

    data.password = await bcrypt.hash(data.password, 10);

    const replacedUser = await this.usersRepository.replace(id, data);
    return excludePassword(replacedUser);
  }

  async delete(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
    }

    await this.usersRepository.delete(id);
  }
}

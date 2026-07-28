import { User } from '@prisma/client';
import { CreateUserDTO, ReplaceUserDTO, UpdateUserDTO } from './users.dtos';

export interface IUsersRepository {
  findById(id: string): Promise<User | null>;
  findByCpf(cpf: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserDTO): Promise<User>;
  update(id: string, data: UpdateUserDTO): Promise<User>;
  replace(id: string, data: ReplaceUserDTO): Promise<User>;
  delete(id: string): Promise<User>;
}

import { prisma } from '../../config/prisma';
import { CreateUserDTO, ReplaceUserDTO, UpdateUserDTO } from './users.dtos';
import { IUsersRepository } from './users.repository.interface';
export class UsersRepository implements IUsersRepository {
  async findAll() {
    return prisma.user.findMany();
  }
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }
  async findByCpf(cpf: string) {
    return prisma.user.findUnique({
      where: { cpf },
    });
  }
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: CreateUserDTO) {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        cpf: data.cpf,
        password: data.password,
      },
    });
  }

  async update(id: string, data: UpdateUserDTO) {
    return prisma.user.update({
      where: { id },
      data: { ...data },
    });
  }

  async replace(id: string, data: ReplaceUserDTO) {
    return prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        cpf: data.cpf,
        password: data.password,
      },
    });
  }

  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }
}

import { User } from '@prisma/client';

export function excludePassword(user: User): Omit<User, 'password'> {
  const userWithoutPassword = { ...user };
  delete (userWithoutPassword as Partial<User>).password;
  return userWithoutPassword;
}

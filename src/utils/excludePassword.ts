import { User } from '@prisma/client';

/**
 * Returns a shallow copy of the user object without the password field.
 *
 * Used before serializing user data in API responses to prevent the
 * hashed password from ever being sent to the client.
 *
 * The spread + delete approach is used instead of destructuring because
 * the function must work with the full Prisma User type, and destructuring
 * would require listing every field explicitly.
 */
export function excludePassword(user: User): Omit<User, 'password'> {
  const userWithoutPassword = { ...user };
  delete (userWithoutPassword as Partial<User>).password;
  return userWithoutPassword;
}

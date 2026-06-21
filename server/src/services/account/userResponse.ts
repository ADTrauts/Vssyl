import type { User } from '@prisma/client';

/** Safe user DTO for auth and profile API responses (password stripped). */
export function createUserResponse(user: User) {
  const { password: _password, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    emailVerified: !!user.emailVerified,
  };
}

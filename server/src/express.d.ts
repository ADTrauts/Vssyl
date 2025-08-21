import type { User as PrismaUser } from '@prisma/client';

// If JWTPayload is not exported, define it here to match index.ts
// interface JWTPayload {
//   id: string;
//   email: string;
//   name: string | null;
// }

// NOTE: To support JWT payloads, use a type guard or assertion in your code where needed.

declare global {
  namespace Express {
    interface User extends PrismaUser {
      id: string;
    }
    interface Request {
      user?: User;
    }
  }
}

export {}; 
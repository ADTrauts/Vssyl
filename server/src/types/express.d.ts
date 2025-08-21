// Extend Express types to include the full Prisma User type
import { User as PrismaUser } from '@prisma/client';

declare global {
  namespace Express {
    interface User extends PrismaUser {
      // The User interface now includes all Prisma User fields:
      // id, name, email, password, role, userNumber, etc.
    }
    
    interface Request {
      user?: User;
    }
  }
}

export {};
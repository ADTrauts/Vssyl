import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Configure Prisma client for Cloud SQL Unix socket connection
const prismaConfig: any = {
  // Add connection pool settings to prevent timeout issues
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
};

// If using Cloud SQL Unix socket connection, configure the client accordingly
if (process.env.DATABASE_URL?.includes('/cloudsql/')) {
  prismaConfig.datasources = {
    db: {
      url: process.env.DATABASE_URL
    }
  };
}

export const prisma = global.prisma || new PrismaClient(prismaConfig);

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
} 
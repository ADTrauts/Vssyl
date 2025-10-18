import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Configure Prisma client for Cloud SQL Unix socket connection
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prismaConfig: any = {
  // Add connection pool settings to prevent timeout issues
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
};

// If using Cloud SQL Unix socket connection, configure the client accordingly
if (process.env.DATABASE_URL?.includes('/cloudsql/')) {
  // URL encode the password in the DATABASE_URL to handle special characters
  const url = new URL(process.env.DATABASE_URL);
  if (url.password) {
    url.password = encodeURIComponent(url.password);
  }
  const encodedUrl = url.toString();
  
  prismaConfig.datasources = {
    db: {
      url: encodedUrl + '?connection_limit=5&pool_timeout=20&connect_timeout=60'
    }
  };
}

export const prisma = global.prisma || new PrismaClient(prismaConfig);

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
} 
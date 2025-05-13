import { PrismaClient } from '@prisma/client'

// Create a singleton instance of PrismaClient
const prismaClientSingleton = () => {
  return new PrismaClient()
}

// Ensure we only create one instance in development
const globalForPrisma = globalThis
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Add middleware for logging if needed
prisma.$use(async (params, next) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()
  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)
  return result
})

export default prisma 
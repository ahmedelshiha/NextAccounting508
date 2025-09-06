import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export function ensureDatabaseUrl(): string {
  if (!process.env.DATABASE_URL) {
    throw new Error('❌ DATABASE_URL is not set. Define it in Netlify environment variables.')
  }
  return process.env.DATABASE_URL
}

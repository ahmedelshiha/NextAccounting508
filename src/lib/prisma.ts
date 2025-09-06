import { PrismaClient } from '@prisma/client'

// Ensure a single PrismaClient instance across hot reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export function ensureDatabaseUrl(): void {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.length === 0) {
    const msg =
      'DATABASE_URL is not set. Prisma cannot connect. Set it in your environment (e.g., Netlify build settings).'
    if (process.env.NODE_ENV === 'production') {
      console.error(msg)
    } else {
      console.warn(msg)
    }
    throw new Error(msg)
  }
}

function getPrismaClient(): PrismaClient {
  ensureDatabaseUrl()

  if (global.prisma) return global.prisma

  const client = new PrismaClient()

  if (process.env.NODE_ENV !== 'production') {
    global.prisma = client
  }

  return client
}

export const prisma = getPrismaClient()

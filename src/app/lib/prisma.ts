export { prisma } from '@/lib/prisma'

export function ensureDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('❌ DATABASE_URL is not set. Define it in Netlify environment variables.')
  }
  return process.env.DATABASE_URL
}

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: any
}

function createFallbackPrisma() {
  console.warn(
    'DATABASE_URL is not set — using a fallback in-memory Prisma stub. Database queries will return empty/default values.'
  )

  const methodHandler = (modelName: string) =>
    new Proxy(
      {},
      {
        get(_, prop: string) {
          // Common Prisma model methods
          if (prop === 'findMany') {
            return async () => []
          }
          if (prop === 'findFirst' || prop === 'findUnique') {
            return async () => null
          }
          if (prop === 'count') {
            return async () => 0
          }
          if (prop === 'create') {
            return async (args?: any) => (args && args.data) || {}
          }
          if (prop === 'update') {
            return async (args?: any) => (args && args.data) || {}
          }
          if (prop === 'delete') {
            return async (_args?: any) => ({})
          }
          if (prop === 'updateMany' || prop === 'deleteMany') {
            return async () => ({ count: 0 })
          }
          if (prop === 'groupBy') {
            return async () => []
          }
          if (prop === 'aggregate') {
            return async () => ({})
          }
          // Default fallback for any other function
          return async () => null
        },
      }
    )

  // Root proxy to provide model proxies and $ methods
  const root = new Proxy(
    {},
    {
      get(_, prop: string) {
        if (prop === '$connect' || prop === '$disconnect' || prop === '$on') {
          return async () => {}
        }
        // Return a model proxy for any accessed model
        return methodHandler(prop)
      },
    }
  )

  return root
}

export const prisma =
  process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0
    ?
      // Use a real PrismaClient when DATABASE_URL is available
      (globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] }))
    :
      // Otherwise use a lightweight stub that prevents runtime crashes
      (globalForPrisma.prisma ?? createFallbackPrisma())

// Preserve singleton in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

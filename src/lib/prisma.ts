import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

function createFallbackPrisma() {
  console.warn(
    'DATABASE_URL is not set — using a fallback in-memory Prisma stub. Database queries will return empty/default values.'
  )

  const modelHandler = () =>
    new Proxy(
      {},
      {
        get(_target: unknown, prop: string) {
          return async () => {
            if (prop === 'findMany') return []
            if (prop === 'count') return 0
            return null
          }
        },
      }
    )

  const root = new Proxy(
    {},
    {
      get(_target, _prop) {
        // Provide basic $ methods used by Prisma
        if (_prop === '$connect' || _prop === '$disconnect' || _prop === '$on') {
          return async () => {}
        }
        // For any model access, return the model proxy
        return modelHandler()
      },
    }
  )

  return root as unknown as PrismaClient
}

export const prisma: PrismaClient =
  process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0
    ? (globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] }))
    : (globalForPrisma.prisma ?? createFallbackPrisma())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

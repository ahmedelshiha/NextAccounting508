import type { PrismaClient as PrismaClientType } from '@prisma/client'
import { registerTenantGuard } from '@/lib/prisma-tenant-guard'

declare global {
  // Cache Prisma in global for hot-reload/dev to avoid multiple instances
  var __prisma__: PrismaClientType | undefined
}

let dbUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || ''
if (dbUrl && dbUrl.startsWith('neon://')) {
  dbUrl = dbUrl.replace('neon://', 'postgresql://')
}

function buildMockPrisma(): PrismaClientType {
  const defaultModelHandler: ProxyHandler<any> = {
    get(_t, prop: string) {
      const fnNames = [
        'findUnique',
        'findFirst',
        'findMany',
        'create',
        'createMany',
        'update',
        'updateMany',
        'delete',
        'deleteMany',
        'upsert',
        'count',
        'aggregate',
        'groupBy',
      ]
      if (fnNames.includes(prop)) {
        return async (_args?: any) => {
          switch (prop) {
            case 'findMany':
              return []
            case 'count':
              return 0
            case 'aggregate':
              return {}
            case 'createMany':
              return { count: 0 }
            case 'create':
              return {}
            default:
              return null
          }
        }
      }
      return async () => null
    },
  }

  const modelProxyFactory = () => new Proxy({}, defaultModelHandler)

  const mockHandler: ProxyHandler<any> = {
    get(_t, _prop) {
      return modelProxyFactory()
    },
  }

  return new Proxy({}, mockHandler) as unknown as PrismaClientType
}

async function createRealClient(url: string): Promise<PrismaClientType> {
  try {
    const mod: any = await import('@prisma/client')
    const PrismaClient = mod.PrismaClient || mod.default?.PrismaClient || mod.default
    const client: PrismaClientType = new PrismaClient(
      url ? { datasources: { db: { url } } } : undefined,
    )
    registerTenantGuard(client as any)
    return client
  } catch (err) {
    if (process.env.NODE_ENV === 'test') {
      // In test environments the generated client may not exist on disk
      return new Proxy(
        {},
        {
          get() {
            throw new Error('@prisma/client is not generated in test environment')
          },
        },
      ) as unknown as PrismaClientType
    }
    throw err
  }
}

export async function getPrisma(): Promise<PrismaClientType> {
  if (process.env.PRISMA_MOCK === 'true' || (process.env.NODE_ENV === 'test' && process.env.PRISMA_MOCK !== 'false')) {
    return buildMockPrisma()
  }

  if (!dbUrl) {
    // In test or development environments, prefer a safe mock client to avoid hard failures
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Database is not configured. Set NETLIFY_DATABASE_URL or DATABASE_URL to enable DB features.')
    }
    // Return a lightweight mock Prisma client so code paths that import prisma don't crash when DB is unavailable
    return buildMockPrisma()
  }

  let client = (typeof global !== 'undefined' ? (global as any).__prisma__ : undefined) as
    | PrismaClientType
    | undefined

  if (!client) {
    client = await createRealClient(dbUrl)
    if (process.env.NODE_ENV !== 'production' && typeof global !== 'undefined') {
      ;(global as any).__prisma__ = client
    }
  }

  return client
}

// Default export: a proxy shim that mirrors the PrismaClient surface.
// Each accessed method defers to the real client via getPrisma().
// This preserves existing call-sites like prisma.user.findMany() without code changes,
// while complying with eslint no-require-imports.
const prisma: PrismaClientType = new Proxy(
  {},
  {
    get(_target, prop) {
      // Return a nested proxy for model access (e.g., prisma.user.create)
      return new Proxy(
        async function noop() {},
        {
          // Handle calling top-level functions (e.g., prisma.$transaction([...]))
          async apply(_t, _thisArg, argArray) {
            const client = await getPrisma()
            const value = (client as any)[prop as any]
            if (typeof value === 'function') {
              return value.apply(client, argArray)
            }
            return value
          },
          // Handle nested access like prisma.user.findMany
          get(_t2, subProp) {
            return new Proxy(
              async function noopMethod() {},
              {
                async apply(_t3, _thisArg, argArray) {
                  const client = await getPrisma()
                  const model = (client as any)[prop as any]
                  const method = model?.[subProp as any]
                  if (typeof method === 'function') {
                    return method.apply(model, argArray)
                  }
                  return method
                },
              },
            )
          },
        },
      )
    },
  },
) as unknown as PrismaClientType

export default prisma

import type { PrismaClient as PrismaClientType } from '@prisma/client'
import { registerTenantGuard } from '@/lib/prisma-tenant-guard'

declare global {
  
  var __prisma__: PrismaClientType | undefined;
}

let dbUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || "";

if (dbUrl && dbUrl.startsWith("neon://")) {
  dbUrl = dbUrl.replace("neon://", "postgresql://");
}

function createClient(url: string) {
  // If PRISMA_MOCK is enabled, return a mock client that is safe to import and
  // can be stubbed in tests. The mock implements common model methods with
  // non-throwing defaults so tests don't crash when DB is absent.
  if (process.env.PRISMA_MOCK === 'true' || process.env.NODE_ENV === 'test' && process.env.PRISMA_MOCK !== 'false') {
    const defaultModelHandler = {
      get(_t: any, prop: string) {
        // Common Prisma model operations
        const fnNames = ['findUnique', 'findFirst', 'findMany', 'create', 'createMany', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert', 'count', 'aggregate']
        if (fnNames.includes(prop)) {
          return async (_args?: any) => {
            switch (prop) {
              case 'findMany': return []
              case 'count': return 0
              case 'aggregate': return {}
              case 'createMany': return { count: 0 }
              case 'create': return {}
              default: return null
            }
          }
        }
        // For any other nested property, return a noop function
        return async () => null
      }
    }

    const modelProxyFactory = () => new Proxy({}, defaultModelHandler)

    const mockHandler: ProxyHandler<any> = {
      get(_t, prop) {
        // Return a model proxy for any model access (prisma.user, prisma.booking, etc.)
        if (typeof prop === 'string') {
          return modelProxyFactory()
        }
        return undefined
      }
    }

    return new Proxy({}, mockHandler) as any
  }

  // Lazily require to avoid loading @prisma/client when DB is not configured

  // This file intentionally uses require() because importing @prisma/client at module
  // initialization can attempt to connect to the DB in environments where the DB
  // is not configured (build/test). Keep lazy require to avoid that behavior.

  let PrismaClientConstructor: any
  try {
    const mod = require('@prisma/client')
    PrismaClientConstructor = mod.PrismaClient || mod.default?.PrismaClient || mod.default
  } catch (err) {
    // In test environments the generated client may not exist on disk. Return a safe
    // dummy proxy so tests that mock src/lib/prisma can still import this module
    // without causing a hard failure during require().
    if (process.env.NODE_ENV === 'test') {
      const dummy = new Proxy({}, { get() { throw new Error('@prisma/client is not generated in test environment') } })
      return dummy as any
    }
    throw err
  }

  const client = new PrismaClientConstructor(url ? { datasources: { db: { url } } } : undefined)
  registerTenantGuard(client as any)
  return client
}

// Export a proxy that lazily creates Prisma client on first use
const prisma: PrismaClientType = (() => {
  let client: PrismaClientType | undefined = (typeof global !== 'undefined' && (global as any).__prisma__) as any

  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (!client) {
        if (!dbUrl) {
          throw new Error('Database is not configured. Set NETLIFY_DATABASE_URL or DATABASE_URL to enable DB features.')
        }
        client = createClient(dbUrl)
        if (process.env.NODE_ENV !== 'production') {
          ;(global as any).__prisma__ = client
        }
      }
      const anyClient = client as any
      return anyClient[prop as any]
    }
  }

  return new Proxy({}, handler) as unknown as PrismaClientType
})();

export default prisma;

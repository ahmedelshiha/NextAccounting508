import type { PrismaClient as PrismaClientType } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClientType | undefined;
}

let dbUrl = process.env.NETLIFY_DATABASE_URL || "";

if (dbUrl && dbUrl.startsWith("neon://")) {
  dbUrl = dbUrl.replace("neon://", "postgresql://");
}

function createClient(url: string) {
  // Lazily require to avoid loading @prisma/client when DB is not configured
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('@prisma/client') as { PrismaClient: new (...args: any[]) => PrismaClientType };
  const client = new PrismaClient(url ? { datasources: { db: { url } } } : undefined);

  // Multi-tenancy middleware: when enabled, automatically scope read/update/delete queries
  // to the tenantId present in process.env.REQUEST_TENANT_ID or MULTI_TENANCY_DEFAULT.
  // This is intentionally conservative: tenantId columns are nullable, so migrations
  // can be applied safely and backfilled later. Per-request tenant scoping should
  // be provided by setting process.env.REQUEST_TENANT_ID prior to executing DB calls
  // (or extend to pass tenant via a request-scoped Prisma client in future).
  try {
    const enabled = String(process.env.MULTI_TENANCY_ENABLED || 'false').toLowerCase() === 'true'
    const pclient: any = client as any
    if (enabled && typeof pclient.$use === 'function') {
      const tenantModels = new Set(['ServiceRequest','Service','TaskTemplate','User','TeamMember','Booking','Post','Template'])
      pclient.$use(async (params: any, next: any) => {
        const model = params.model
        const action = params.action
        const tenantId = process.env.REQUEST_TENANT_ID || process.env.MULTI_TENANCY_DEFAULT

        if (!model || !tenantModels.has(model)) {
          return next(params)
        }

        // For read/update/delete operations, inject tenantId into where clause if not present
        const readOps = new Set(['findUnique','findFirst','findMany','count'])
        const writeOps = new Set(['updateMany','deleteMany','update','delete'])

        if (readOps.has(action) || writeOps.has(action)) {
          params.args = params.args || {}
          const where = params.args.where || {}
          // If where already contains tenantId, respect it
          if (!Object.prototype.hasOwnProperty.call(where, 'tenantId')) {
            if (tenantId) {
              params.args.where = { AND: [where, { tenantId }] }
            } else {
              // If no tenant provided, do not silently restrict reads; allow existing behaviour
              params.args.where = where
            }
          }
        }

        // For create actions, set tenantId if provided via env and not specified in data
        if (action === 'create' || action === 'createMany') {
          params.args = params.args || {}
          const data = params.args.data || {}
          if (tenantId && !Object.prototype.hasOwnProperty.call(data, 'tenantId')) {
            if (Array.isArray(data)) {
              params.args.data = data.map((d: any) => ({ ...d, tenantId }))
            } else {
              params.args.data = { ...data, tenantId }
            }
          }
        }

        return next(params)
      })
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Prisma tenant middleware setup failed:', e)
  }

  return client
}

// Export a proxy that lazily creates Prisma client on first use
const prisma: PrismaClientType = (() => {
  let client: PrismaClientType | undefined = (typeof global !== 'undefined' && (global as any).__prisma__) as any

  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (!client) {
        if (!dbUrl) {
          throw new Error('Database is not configured. Set NETLIFY_DATABASE_URL to enable DB features.')
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

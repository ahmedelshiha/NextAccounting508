import type { PrismaClient as PrismaClientType } from '@prisma/client'

declare global {
   
  var __prisma__: PrismaClientType | undefined;
}

let dbUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || "";

if (dbUrl && dbUrl.startsWith("neon://")) {
  dbUrl = dbUrl.replace("neon://", "postgresql://");
}

function createClient(url: string) {
  // Lazily require to avoid loading @prisma/client when DB is not configured
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client') as { PrismaClient: new (...args: any[]) => PrismaClientType };
  return new PrismaClient(url ? { datasources: { db: { url } } } : undefined);
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

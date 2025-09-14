import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma__: PrismaClient | undefined;
}

let dbUrl = process.env.NETLIFY_DATABASE_URL || "";

if (dbUrl && dbUrl.startsWith("neon://")) {
  dbUrl = dbUrl.replace("neon://", "postgresql://");
}

function createClient(url: string) {
  return new PrismaClient(url ? { datasources: { db: { url } } } : undefined);
}

// Export a proxy that lazily creates Prisma client on first use
const prisma: PrismaClient = (() => {
  let client: PrismaClient | undefined = (typeof global !== 'undefined' && global.__prisma__) as any

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

  return new Proxy({}, handler) as unknown as PrismaClient
})();

export default prisma;

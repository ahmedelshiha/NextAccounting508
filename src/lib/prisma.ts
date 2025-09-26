import type { PrismaClient as PrismaClientType } from '@prisma/client'

declare global {
  // Reuse a single Prisma instance in dev to avoid connection exhaustion
  // and track whether shutdown hooks are registered
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClientType | undefined
  // eslint-disable-next-line no-var
  var __prismaHooks__: boolean | undefined
}

let dbUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || ''

if (dbUrl && dbUrl.startsWith('neon://')) {
  dbUrl = dbUrl.replace('neon://', 'postgresql://')
}

function createClient(url: string) {
  // Lazily require to avoid loading @prisma/client in environments without DB
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client') as { PrismaClient: new (...args: any[]) => PrismaClientType }

  const options: Record<string, any> = {}
  if (url) {
    options.datasources = { db: { url } }
  }
  options.log = process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']

  const client = new PrismaClient(options)

  if (!global.__prismaHooks__) {
    global.__prismaHooks__ = true
    const disconnect = async () => {
      try {
        await client.$disconnect()
      } catch {}
    }
    process.on('beforeExit', disconnect)
    process.on('SIGINT', async () => { await disconnect(); process.exit(0) })
    process.on('SIGTERM', async () => { await disconnect(); process.exit(0) })
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
          throw new Error('Database is not configured. Set NETLIFY_DATABASE_URL or DATABASE_URL to enable DB features.')
        }
        client = createClient(dbUrl)
        if (process.env.NODE_ENV !== 'production') {
          ;(global as any).__prisma__ = client
        }
      }
      const anyClient = client as any
      return anyClient[prop as any]
    },
  }

  return new Proxy({}, handler) as unknown as PrismaClientType
})()

export default prisma

// Optional: expose minimal config for tooling/CLIs if needed
export const config = {
  datasourceUrl: dbUrl || undefined,
}

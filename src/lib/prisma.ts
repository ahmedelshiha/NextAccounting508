import type { PrismaClient as PrismaClientType } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClientType | undefined;
}

let dbUrl = process.env.NETLIFY_DATABASE_URL || "";
if (dbUrl && dbUrl.startsWith("neon://")) {
  dbUrl = dbUrl.replace("neon://", "postgresql://");
}

let PrismaClientCtor: (new (...args: any[]) => PrismaClientType) | null = null;

function loadPrismaClientCtor(): void {
  if (PrismaClientCtor) return;
  try {
    // Defer requiring @prisma/client until absolutely necessary to avoid runtime errors
    // when the Prisma client hasn't been generated yet.
    // Using eval('require') prevents bundlers from eagerly resolving it.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const req = (0, eval)('require') as NodeRequire;
    const mod = req('@prisma/client');
    PrismaClientCtor = mod.PrismaClient as typeof PrismaClientType;
  } catch {
    throw new Error('Prisma Client is not available. Run "prisma generate" and ensure dependencies are installed.');
  }
}

function createClient(url: string): PrismaClientType {
  loadPrismaClientCtor();
  const Ctor = PrismaClientCtor!;
  return url ? new Ctor({ datasources: { db: { url } } }) : new Ctor();
}

// Export a proxy that lazily creates Prisma client on first use and only when DB is configured
const prisma: PrismaClientType = (() => {
  let client: PrismaClientType | undefined = (typeof global !== 'undefined' && global.__prisma__) as PrismaClientType | undefined;

  const handler: ProxyHandler<Record<string | symbol, unknown>> = {
    get(_target, prop) {
      if (!client) {
        if (!dbUrl) {
          throw new Error('Database is not configured. Set NETLIFY_DATABASE_URL to enable DB features.');
        }
        client = createClient(dbUrl);
        if (process.env.NODE_ENV !== 'production') {
          (global as any).__prisma__ = client;
        }
      }
      return (client as any)[prop as any];
    },
  };

  return new Proxy({}, handler) as unknown as PrismaClientType;
})();

export default prisma;

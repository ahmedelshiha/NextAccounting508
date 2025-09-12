import { PrismaClient } from "@prisma/client";

import { PrismaClient } from "@prisma/client";

let exportedPrisma: any = null

if (process.env.NODE_ENV === 'test') {
  let thresholds: any[] = []
  exportedPrisma = {
    healthThreshold: {
      findFirst: async () => (thresholds.length ? thresholds[thresholds.length - 1] : null),
      create: async ({ data }: any) => {
        const id = thresholds.length + 1
        const rec = { id, ...data }
        thresholds.push(rec)
        return rec
      },
      update: async ({ where, data }: any) => {
        const rec = thresholds.find((r) => r.id === where.id)
        if (!rec) throw new Error('not found')
        Object.assign(rec, data)
        return rec
      },
      deleteMany: async () => { thresholds = []; return { count: 0 } },
    },
    $disconnect: async () => {},
  }
}

declare global {
  var __prisma__: PrismaClient | undefined;
}

if (!exportedPrisma) {
  let dbUrl = process.env.NETLIFY_DATABASE_URL || "";

  if (dbUrl && dbUrl.startsWith("neon://")) {
    dbUrl = dbUrl.replace("neon://", "postgresql://");
  }

  function createClient(url: string) {
    return new PrismaClient(url ? { datasources: { db: { url } } } : undefined);
  }

  // Export a real Prisma client if DB URL present; otherwise export a safe proxy that throws on use
  exportedPrisma = (() => {
    if (typeof global !== "undefined" && (global as any).__prisma__) return (global as any).__prisma__;

    const client = dbUrl
      ? createClient(dbUrl)
      : (new Proxy(
          {},
          {
            get() {
              throw new Error(
                "Database is not configured. Set NETLIFY_DATABASE_URL to enable DB features."
              );
            },
          }
        ) as unknown as PrismaClient);

    if (process.env.NODE_ENV !== "production") {
      ;(global as any).__prisma__ = client;
    }

    return client;
  })()
}

export default exportedPrisma

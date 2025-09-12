import { PrismaClient } from "@prisma/client"

type HealthThresholdRecord = {
  id: number
  responseTime?: number
  errorRate?: number
  storageGrowth?: number
  createdAt?: Date
  updatedAt?: Date
}

interface TestPrisma {
  healthThreshold: {
    findFirst: () => Promise<HealthThresholdRecord | null>
    create: (args: { data: Partial<HealthThresholdRecord> }) => Promise<HealthThresholdRecord>
    update: (args: { where: { id: number }; data: Partial<HealthThresholdRecord> }) => Promise<HealthThresholdRecord>
    deleteMany: () => Promise<{ count: number }>
  }
  $disconnect: () => Promise<void>
}

// Always export PrismaClient type for compile-time to avoid union type errors across the app
let exportedPrisma: PrismaClient | null = null

if (process.env.NODE_ENV === 'test' || (process as unknown as { VITEST?: string }).VITEST) {
  let thresholds: HealthThresholdRecord[] = []
  const testClient: TestPrisma = {
    healthThreshold: {
      findFirst: async () => (thresholds.length ? thresholds[thresholds.length - 1] : null),
      create: async ({ data }: { data: Partial<HealthThresholdRecord> }) => {
        const id = thresholds.length + 1
        const rec = { id, ...data }
        thresholds.push(rec)
        return rec
      },
      update: async ({ where, data }: { where: { id: number }; data: Partial<HealthThresholdRecord> }) => {
        const rec = thresholds.find((r) => r.id === where.id)
        if (!rec) throw new Error('not found')
        Object.assign(rec, data)
        return rec
      },
      deleteMany: async () => { thresholds = []; return { count: 0 } },
    },
    $disconnect: async () => { return },
  }
  exportedPrisma = testClient as unknown as PrismaClient
}

declare global {
  var __prisma__: PrismaClient | undefined;
}

if (!exportedPrisma) {
  let dbUrl = process.env.NETLIFY_DATABASE_URL || ""

  if (dbUrl && dbUrl.startsWith("neon://")) {
    dbUrl = dbUrl.replace("neon://", "postgresql://")
  }

  function createClient(url: string) {
    return new PrismaClient(url ? { datasources: { db: { url } } } : undefined)
  }

  // Export a real Prisma client if DB URL present; otherwise export a safe proxy that throws on use
  exportedPrisma = (() => {
    type GlobalWithPrisma = typeof globalThis & { __prisma__?: PrismaClient }
    const g = global as unknown as GlobalWithPrisma
    if (typeof global !== "undefined" && g.__prisma__) return g.__prisma__ as PrismaClient

    const client = dbUrl
      ? createClient(dbUrl)
      : (new Proxy(
          {},
          {
            get() {
              throw new Error(
                "Database is not configured. Set NETLIFY_DATABASE_URL to enable DB features."
              )
            },
          }
        ) as unknown as PrismaClient)

    if (process.env.NODE_ENV !== "production") {
      ;(global as unknown as { __prisma__?: PrismaClient }).__prisma__ = client
    }

    return client
  })()
}

export default exportedPrisma

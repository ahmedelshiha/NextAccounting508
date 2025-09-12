import { PrismaClient } from "@prisma/client"

// Simple record used for tests to avoid touching a real DB
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

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined
}

const isVitest = Boolean((process as unknown as { VITEST?: string }).VITEST)
const isTestEnv = process.env.NODE_ENV === "test" || isVitest

function normalizeDbUrl(url: string): string {
  if (url.startsWith("neon://")) return url.replace("neon://", "postgresql://")
  return url
}

function createRealClient(): PrismaClient {
  let dbUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || ""
  if (dbUrl) dbUrl = normalizeDbUrl(dbUrl)

  if (!dbUrl) {
    // Provide a typed proxy that throws on use if DB isn't configured
    return new Proxy(
      {},
      {
        get() {
          throw new Error("Database is not configured. Set NETLIFY_DATABASE_URL (or DATABASE_URL) to enable DB features.")
        },
      }
    ) as unknown as PrismaClient
  }

  return new PrismaClient({ datasources: { db: { url: dbUrl } } })
}

function getSingleton(): PrismaClient {
  if (isTestEnv) {
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
          if (!rec) throw new Error("not found")
          Object.assign(rec, data)
          return rec
        },
        deleteMany: async () => {
          thresholds = []
          return { count: 0 }
        },
      },
      $disconnect: async () => {
        return
      },
    }
    return testClient as unknown as PrismaClient
  }

  // Reuse a single instance in dev to avoid connection exhaustion
  const g = global as unknown as { __prisma__?: PrismaClient }
  if (g.__prisma__) return g.__prisma__

  const client = createRealClient()
  if (process.env.NODE_ENV !== "production") {
    g.__prisma__ = client
  }
  return client
}

const prisma: PrismaClient = getSingleton()
export default prisma

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
// Mock prisma with in-memory store
const thresholdsStore: any[] = []
vi.mock('@/lib/prisma', () => ({
  default: {
    healthThreshold: {
      deleteMany: vi.fn(async () => { thresholdsStore.length = 0; return { count: 0 } }),
      create: vi.fn(async ({ data }: any) => { const rec = { id: 't1', ...data }; thresholdsStore.push(rec); return rec }),
      findFirst: vi.fn(async () => thresholdsStore[0] || null),
    },
    $disconnect: vi.fn(async () => {})
  }
}))

// Mock next-auth getServerSession before importing the route module.
vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }))

// Override the tenant-utils mock for this test to control userId
vi.mock('@/lib/tenant-utils', () => {
  let _userId: string | null = 'test-user'
  let _role: string = 'ADMIN'
  return {
    requireTenantContext: () => {
      if (_userId === null) {
        return { tenantId: 'test-tenant', userId: null, role: null }
      }
      return { tenantId: 'test-tenant', userId: _userId, role: _role }
    },
    getTenantFilter: () => ({ tenantId: 'test-tenant' }),
    __setTestUserId: (userId: string | null) => { _userId = userId },
    __setTestRole: (role: string) => { _role = role }
  }
})

let GET: any
let POST: any
let mockedGetServerSession: any
let tenantUtils: any

beforeAll(async () => {
  // Import the mocked getServerSession for control in tests
  const nextAuth = await import('next-auth/next')
  mockedGetServerSession = nextAuth.getServerSession

  // Import tenant utils for controlling userId
  tenantUtils = await import('@/lib/tenant-utils')

  // Import the route handlers after mocking
  const route = await import('@/app/api/admin/thresholds/route')
  GET = route.GET
  POST = route.POST

  // Ensure DB clean state for tests
  const prisma = await import('@/lib/prisma')
  await prisma.default.healthThreshold.deleteMany()
})

afterAll(async () => {
  // clean up
  const prisma = await import('@/lib/prisma')
  await prisma.default.healthThreshold.deleteMany()
  await prisma.default.$disconnect()
})

describe('Thresholds API (unit/integration style)', () => {
  beforeEach(async () => {
    // Reset context to authenticated admin by default
    tenantUtils.__setTestUserId('test-user')
    tenantUtils.__setTestRole('ADMIN')
  })

  it('returns 401 for unauthenticated GET and POST', async () => {
    // Mock unauthenticated by setting userId to null
    tenantUtils.__setTestUserId(null)
    mockedGetServerSession.mockResolvedValue(null)

    const resGet: any = await GET({} as any)
    expect(resGet.status).toBe(401)

    const reqPost = { json: async () => ({ responseTime: 50, errorRate: 0.5, storageGrowth: 5 }) } as any
    const resPost: any = await POST(reqPost)
    expect(resPost.status).toBe(401)
  })

  it('allows ADMIN to POST thresholds and GET returns updated values', async () => {
    // Mock admin session
    mockedGetServerSession.mockResolvedValue({ user: { id: 'admin-id', role: 'ADMIN' } })

    const payload = { responseTime: 321, errorRate: 3.21, storageGrowth: 9.9 }
    const reqPost = { json: async () => payload } as any

    const resPost: any = await POST(reqPost)
    expect(resPost.status).toBe(200)
    const postJson = await resPost.json()
    expect(postJson.responseTime).toBe(payload.responseTime)
    expect(postJson.errorRate).toBe(payload.errorRate)
    expect(postJson.storageGrowth).toBe(payload.storageGrowth)

    // GET should return updated values
    const resGet: any = await GET({} as any)
    expect(resGet.status).toBe(200)
    const getJson = await resGet.json()
    expect(getJson.responseTime).toBe(payload.responseTime)
    expect(getJson.errorRate).toBe(payload.errorRate)
    expect(getJson.storageGrowth).toBe(payload.storageGrowth)
  })
})

describe('Performance budgets (static gating)', () => {
  it('enforces default budgets for LCP and CLS', () => {
    const lcpBudgetMs = Number(process.env.PERF_BUDGET_LCP_MS || 2500)
    const clsBudget = Number(process.env.PERF_BUDGET_CLS || 0.1)
    // Budgets must not be loosened beyond defaults
    expect(lcpBudgetMs).toBeLessThanOrEqual(2500)
    expect(clsBudget).toBeLessThanOrEqual(0.1)
  })
})

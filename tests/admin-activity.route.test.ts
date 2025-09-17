import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }))

let GET: any
let mockedGetServerSession: any

beforeAll(async () => {
  const nextAuth = await import('next-auth/next')
  mockedGetServerSession = nextAuth.getServerSession
  const mod = await import('@/app/api/admin/activity/route')
  GET = mod.GET
})

afterAll(() => {
  vi.resetAllMocks()
})

describe('Admin Activity API', () => {
  it('requires ANALYTICS_VIEW permission (401 when not logged in)', async () => {
    mockedGetServerSession.mockResolvedValue(null)
    const req = new Request('http://localhost/api/admin/activity')
    const res: any = await GET(req as any)
    expect(res.status).toBe(401)
  })

  it('returns data+pagination shape with fallback when no DB', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } })
    const req = new Request('http://localhost/api/admin/activity?type=AUDIT&page=1&limit=5&q=demo&status=ALL')
    const res: any = await GET(req as any)
    expect(res.status || 200).toBe(200)
    const json = await res.json()
    expect(json).toBeTruthy()
    // shape check
    expect(json).toHaveProperty('data')
    expect(json).toHaveProperty('pagination')
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.pagination).toHaveProperty('page')
    expect(json.pagination).toHaveProperty('limit')
    expect(json.pagination).toHaveProperty('total')
    expect(json.pagination).toHaveProperty('totalPages')
  })
})

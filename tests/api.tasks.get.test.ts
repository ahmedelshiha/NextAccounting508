import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { role: 'ADMIN' } }),
}))

// Use dynamic import to ensure mocks apply
async function loadRoute() {
  return await import('@/app/api/admin/tasks/route')
}

describe('GET /api/admin/tasks', () => {
  beforeEach(() => {
    delete (process.env as any).NETLIFY_DATABASE_URL
  })

  it('returns fallback tasks with pagination', async () => {
    const { GET } = await loadRoute()
    const req = new Request('http://localhost/api/admin/tasks?limit=2&page=1')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.tasks)).toBe(true)
    expect(json.tasks.length).toBeGreaterThan(0)
    expect(json.pagination).toBeDefined()
    expect(json.pagination.limit).toBe(2)
  })

  it('applies server-side search (q)', async () => {
    const { GET } = await loadRoute()
    const req = new Request('http://localhost/api/admin/tasks?q=newsletters')
    const res = await GET(req as any)
    const json = await res.json()
    expect(json.tasks.some((t: any) => String(t.title).toLowerCase().includes('newsletter'))).toBe(true)
  })
})

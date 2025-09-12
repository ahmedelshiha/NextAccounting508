import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { role: 'ADMIN' } }),
}))

async function loadRoute() {
  return await import('@/app/api/admin/tasks/export/route')
}

describe('GET /api/admin/tasks/export', () => {
  beforeEach(() => {
    delete (process.env as any).NETLIFY_DATABASE_URL
  })

  it('returns CSV when format=csv', async () => {
    const { GET } = await loadRoute()
    const req = new Request('http://localhost/api/admin/tasks/export?format=csv')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type') || '').toContain('text/csv')
    const text = await res.text()
    expect(text.split('\n')[0]).toContain('id,title,description,priority,status,dueAt,assigneeId,createdAt,updatedAt')
  })

  it('returns JSON by default', async () => {
    const { GET } = await loadRoute()
    const req = new Request('http://localhost/api/admin/tasks/export')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.tasks)).toBe(true)
  })
})

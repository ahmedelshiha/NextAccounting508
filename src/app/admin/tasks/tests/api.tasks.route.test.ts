import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../prisma/client', () => {
  return {
    prisma: {
      task: {
        findMany: vi.fn(async () => [{ id: '1' }]),
        create: vi.fn(async ({ data }) => ({ id: '2', ...data }))
      }
    }
  }
})

describe('api/admin/tasks route', () => {
  it('GET returns tasks', async () => {
    const { GET } = await import('../api/admin/tasks/route')
    const res: any = await GET(new Request('https://example.com/api/admin/tasks?limit=10'))
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  it('POST validates and creates', async () => {
    const { POST } = await import('../api/admin/tasks/route')
    const resBad: any = await POST(new Request('https://example.com/api/admin/tasks', { method: 'POST', body: JSON.stringify({}) }))
    expect(resBad.status).toBe(400)

    const resOk: any = await POST(new Request('https://example.com/api/admin/tasks', { method: 'POST', body: JSON.stringify({ title: 'X', estimatedHours: 1 }) }))
    expect(resOk.status).toBe(201)
    const data = await resOk.json()
    expect(data.id).toBeDefined()
  })
})

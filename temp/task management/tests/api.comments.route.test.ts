import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = { comments: [{ id: 'c1', content: 'hi', createdAt: new Date().toISOString() }] as any[] }

vi.mock('../prisma/client', () => {
  return {
    prisma: {
      task: {
        findUnique: vi.fn(async () => ({ comments: state.comments })),
        update: vi.fn(async ({ data }: any) => { state.comments = data.comments; return { id: '1' } })
      }
    }
  }
})

describe('api/admin/tasks/[id]/comments route', () => {
  beforeEach(() => { state.comments = [{ id: 'c1', content: 'hi', createdAt: new Date().toISOString() }] })

  it('GET returns list', async () => {
    const { GET }: any = await import('../api/admin/tasks/[id]/comments/route')
    const res: any = await GET(new Request('https://x'), { params: { id: '1' } } as any)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBeGreaterThan(0)
  })

  it('POST validates payload and appends comment', async () => {
    const { POST }: any = await import('../api/admin/tasks/[id]/comments/route')
    const bad: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify({}) }), { params: { id: '1' } } as any)
    expect(bad.status).toBe(400)

    const ok: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify({ content: 'new' }) }), { params: { id: '1' } } as any)
    expect(ok.status).toBe(201)
    const created = await ok.json()
    expect(created.content).toBe('new')
  })
})

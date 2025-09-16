import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  default: {
    template: {
      findMany: vi.fn(async () => [{ id: 't1', key: 'k1', name: 'Template 1', content: 'c', createdAt: new Date().toISOString() }]),
      create: vi.fn(async ({ data }: any) => ({ id: 't2', ...data, createdAt: new Date().toISOString() })),
      findUnique: vi.fn(async ({ where }: any) => (where.id === 't1' ? { id: 't1', key: 'k1', name: 'Template 1', content: 'c' } : null)),
      update: vi.fn(async ({ where, data }: any) => ({ id: where.id, ...data })),
      delete: vi.fn(async ({ where }: any) => ({ id: where.id })),
    }
  }
}))

describe('Templates API', () => {
  it('GET list returns templates', async () => {
    const mod: any = await import('@/app/api/templates/route')
    const res: any = await mod.GET(new Request('https://x'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
  })

  it('POST creates template', async () => {
    const { POST }: any = await import('@/app/api/templates/route')
    const payload = { key: 'k2', name: 'T2', content: 'body' }
    const res: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify(payload) }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.key).toBe('k2')
  })

  it('GET by id returns a template', async () => {
    const mod: any = await import('@/app/api/templates/[id]/route')
    const res: any = await mod.GET(new Request('https://x'), { params: { id: 't1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.id).toBe('t1')
  })

  it('PATCH updates a template', async () => {
    const mod: any = await import('@/app/api/templates/[id]/route')
    const res: any = await mod.PATCH(new Request('https://x', { method: 'PATCH', body: JSON.stringify({ name: 'Updated' }) }), { params: { id: 't1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.name).toBe('Updated')
  })

  it('DELETE removes a template', async () => {
    const mod: any = await import('@/app/api/templates/[id]/route')
    const res: any = await mod.DELETE(new Request('https://x', { method: 'DELETE' }), { params: { id: 't1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.id).toBe('t1')
  })
})

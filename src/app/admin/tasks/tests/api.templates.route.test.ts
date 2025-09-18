import { describe, it, expect, vi, beforeEach } from 'vitest'

const mem = { data: '' as string }

vi.mock('fs', async () => {
  const actual = await vi.importActual('fs')
  return {
    ...actual,
    readFileSync: vi.fn(() => (mem.data || '[]')),
    writeFileSync: vi.fn((_p: string, content: string) => { mem.data = content }),
    mkdirSync: vi.fn(() => {})
  }
})

describe('api/admin/tasks/templates route', () => {
  beforeEach(() => { mem.data = '[]' })

  it('supports CRUD operations', async () => {
    const mod: any = await import('@/app/api/admin/tasks/templates/route')

    const get1: any = await mod.GET()
    let list = await get1.json()
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBe(0)

    const createdRes: any = await mod.POST(new Request('https://x', { method: 'POST', body: JSON.stringify({ name: 'T1', content: 'C' }) }))
    expect(createdRes.status).toBe(201)
    const created = await createdRes.json()
    expect(created.id).toBeDefined()

    const patchRes: any = await mod.PATCH(new Request('https://x', { method: 'PATCH', body: JSON.stringify({ id: created.id, name: 'T2' }) }))
    expect(patchRes.status).toBe(200)
    const updated = await patchRes.json()
    expect(updated.name).toBe('T2')

    const delRes: any = await mod.DELETE(new Request('https://x?id=' + encodeURIComponent(created.id), { method: 'DELETE' }))
    expect(delRes.status).toBe(200)
    const ok = await delRes.json()
    expect(ok.ok).toBe(true)
  })
})

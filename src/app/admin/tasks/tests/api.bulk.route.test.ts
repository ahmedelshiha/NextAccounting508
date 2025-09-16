import { describe, it, expect, vi } from 'vitest'

const calls: any = { deleteMany: 0, updateMany: 0 }

vi.mock('@/lib/prisma', () => {
  return {
    default: {
      task: {
        deleteMany: vi.fn(async () => { calls.deleteMany++; return { count: 1 } }),
        updateMany: vi.fn(async () => { calls.updateMany++; return { count: 1 } }),
      },
    },
  }
})

describe('api/admin/tasks/bulk route', () => {
  it('validates input', async () => {
    const { POST }: any = await import('../api/admin/tasks/bulk/route')
    const res: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify({}) }))
    expect(res.status).toBe(400)
  })

  it('performs delete/update/assign actions', async () => {
    const { POST }: any = await import('../api/admin/tasks/bulk/route')

    const del: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify({ action: 'delete', taskIds: ['1'] }) }))
    expect(del.status).toBe(200)

    const upd: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify({ action: 'update', taskIds: ['1'], updates: { status: 'DONE' } }) }))
    expect(upd.status).toBe(200)

    const asg: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify({ action: 'assign', taskIds: ['1'], updates: { assigneeId: 'u1' } }) }))
    expect(asg.status).toBe(200)

    const unk: any = await POST(new Request('https://x', { method: 'POST', body: JSON.stringify({ action: 'noop', taskIds: ['1'] }) }))
    expect(unk.status).toBe(400)
  })
})

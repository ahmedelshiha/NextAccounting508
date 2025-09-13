import { describe, it, expect, vi } from 'vitest'

vi.mock('../prisma/client', () => {
  return {
    prisma: {
      task: {
        findMany: vi.fn(async () => ([
          {
            id: '1',
            title: 'A',
            description: 'd',
            priority: 'HIGH',
            status: 'OPEN',
            assignee: { id: 'u1', name: 'Alice', email: 'a@e.com' },
            dueAt: null,
            tags: ['alpha','beta'],
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            updatedAt: new Date('2025-01-02T00:00:00.000Z')
          }
        ]))
      }
    }
  }
})

describe('api/admin/tasks/export route', () => {
  it('returns CSV with headers and rows', async () => {
    const { GET } = await import('../api/admin/tasks/export/route')
    const res: any = await GET(new Request('https://example.com/api/admin/tasks/export?format=csv'))
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text.startsWith('id,title,description,priority,status,assignee,dueAt,tags,createdAt')).toBe(true)
    expect(text).toContain('A')
    expect(text).toContain('HIGH')
  })
})

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })),
}))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/rate-limit', () => ({ getClientIp: () => '127.0.0.1', rateLimit: () => true }))

const db: any = {
  items: [
    {
      id: 'sr1',
      uuid: 'u1',
      title: 'VAT Return Q1',
      status: 'SUBMITTED',
      priority: 'MEDIUM',
      client: { id: 'c1', name: 'Alice', email: 'alice@example.com' },
      service: { id: 's1', name: 'Tax Filing', slug: 'tax-filing' },
      assignedTeamMember: { id: 'tm1', name: 'Bob', email: 'bob@example.com' },
      budgetMin: null,
      budgetMax: null,
      deadline: null,
      createdAt: new Date('2024-01-05T12:00:00Z'),
    },
    {
      id: 'sr2',
      uuid: 'u2',
      title: 'Payroll Feb',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      client: { id: 'c2', name: 'Carol', email: 'carol@example.com' },
      service: { id: 's2', name: 'Payroll', slug: 'payroll' },
      assignedTeamMember: null,
      budgetMin: 1000,
      budgetMax: 2000,
      deadline: new Date('2024-02-20T00:00:00Z'),
      createdAt: new Date('2024-02-01T09:00:00Z'),
    },
  ],
}

vi.mock('@/lib/prisma', () => ({
  default: {
    serviceRequest: {
      findMany: vi.fn(async ({ where, take = 500, cursor }: any) => {
        // basic filter by status/priority/q assignedTo simulation
        let items = [...db.items]
        if (where?.status) items = items.filter((i) => i.status === where.status)
        if (where?.priority) items = items.filter((i) => i.priority === where.priority)
        if (where?.assignedTeamMemberId) items = items.filter((i) => i.assignedTeamMember?.id === where.assignedTeamMemberId)
        if (where?.serviceId) items = items.filter((i) => i.service?.id === where.serviceId)
        if (where?.clientId) items = items.filter((i) => i.client?.id === where.clientId)
        const q = where?.OR?.[0]?.title?.contains || where?.OR?.[1]?.description?.contains
        if (q) items = items.filter((i) => i.title.toLowerCase().includes(String(q).toLowerCase()))
        // cursor paging by id (simplified)
        const start = cursor ? items.findIndex((i) => i.id === cursor.id) + 1 : 0
        return items.slice(start, start + take)
      }),
    },
  },
}))

describe('api/admin/service-requests/export route', () => {
  it('returns CSV with header and rows; supports filters', async () => {
    const { GET }: any = await import('@/app/api/admin/service-requests/export/route')
    const url = 'https://x?status=SUBMITTED&q=VAT'
    const res: any = await GET(new Request(url))
    expect(res.status).toBe(200)
    const text = await res.text()
    const lines = text.trim().split('\n')
    expect(lines[0]).toContain('id,uuid,title,status,priority,clientName,clientEmail,serviceName,assignedTo,budgetMin,budgetMax,deadline,createdAt')
    expect(lines.length).toBeGreaterThan(1)
    // Only the first item matches filters
    expect(text).toContain('sr1')
    expect(text).not.toContain('sr2')
  })
})

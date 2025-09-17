import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/realtime-enhanced', () => ({
  realtimeService: {
    emitTeamAssignment: vi.fn(() => {}),
  },
}))

// In-memory fixtures
const db: any = {
  serviceRequest: {
    id: 'req1',
    title: 'Bookkeeping Setup',
    assignedTeamMemberId: null as string | null,
    service: { category: 'bookkeeping', name: 'Bookkeeping' },
  },
  teamMembers: [] as Array<{ id: string; name: string; email: string; specialties?: string[] }>,
  workloadByMember: {} as Record<string, number>,
}

vi.mock('@/lib/prisma', () => ({
  default: {
    serviceRequest: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where?.id !== db.serviceRequest.id) return null
        return { ...db.serviceRequest }
      }),
      count: vi.fn(async ({ where }: any) => {
        const id = String(where?.assignedTeamMemberId)
        return db.workloadByMember[id] ?? 0
      }),
      update: vi.fn(async ({ where, data }: any) => {
        if (where?.id !== db.serviceRequest.id) throw new Error('not found')
        db.serviceRequest = { ...db.serviceRequest, ...data }
        return { ...db.serviceRequest }
      }),
    },
    teamMember: {
      findMany: vi.fn(async () => db.teamMembers.map((t) => ({ ...t }))),
    },
  },
}))

describe('autoAssignServiceRequest', () => {
  beforeEach(() => {
    db.serviceRequest = {
      id: 'req1',
      title: 'Bookkeeping Setup',
      assignedTeamMemberId: null,
      service: { category: 'bookkeeping', name: 'Bookkeeping' },
    }
    db.teamMembers = []
    db.workloadByMember = {}
  })

  it('prefers skill matches over lower workload', async () => {
    db.teamMembers = [
      { id: 'tm1', name: 'Alice', email: 'a@x.com', specialties: ['bookkeeping'] },
      { id: 'tm2', name: 'Bob', email: 'b@x.com', specialties: ['tax'] },
    ]
    db.workloadByMember = { tm1: 5, tm2: 0 }

    const { autoAssignServiceRequest } = await import('@/lib/service-requests/assignment')
    const updated = await autoAssignServiceRequest('req1')
    expect(updated).toBeTruthy()
    expect(updated?.assignedTeamMemberId).toBe('tm1')
  })

  it('falls back to least workload when no skill matches', async () => {
    db.teamMembers = [
      { id: 'tm1', name: 'Alice', email: 'a@x.com', specialties: ['tax'] },
      { id: 'tm2', name: 'Bob', email: 'b@x.com', specialties: ['advisory'] },
    ]
    db.workloadByMember = { tm1: 3, tm2: 1 }

    const { autoAssignServiceRequest } = await import('@/lib/service-requests/assignment')
    const updated = await autoAssignServiceRequest('req1')
    expect(updated?.assignedTeamMemberId).toBe('tm2')
  })

  it('returns early if already assigned', async () => {
    db.serviceRequest.assignedTeamMemberId = 'existing'

    const { autoAssignServiceRequest } = await import('@/lib/service-requests/assignment')
    const updated = await autoAssignServiceRequest('req1')
    expect(updated?.assignedTeamMemberId).toBe('existing')
  })

  it('no team members leaves request unassigned', async () => {
    db.teamMembers = []

    const { autoAssignServiceRequest } = await import('@/lib/service-requests/assignment')
    const updated = await autoAssignServiceRequest('req1')
    expect(updated?.assignedTeamMemberId).toBeNull()
  })
})

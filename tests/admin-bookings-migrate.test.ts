import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

const db: any = {
  bookings: [
    { id: 'b1', clientId: 'client1', serviceId: 'svc1', notes: 'note', scheduledAt: new Date().toISOString(), duration: 60 },
  ],
  serviceRequests: []
}

vi.mock('@/lib/prisma', () => ({
  default: {
    booking: {
      findUnique: vi.fn(async ({ where }: any) => db.bookings.find(b => b.id === where.id)),
      update: vi.fn(async ({ where, data }: any) => {
        const idx = db.bookings.findIndex(b => b.id === where.id)
        if (idx === -1) return null
        // handle connect shorthand for serviceRequest
        const updated = { ...db.bookings[idx] }
        if (data?.serviceRequest?.connect?.id) {
          updated.serviceRequestId = data.serviceRequest.connect.id
        }
        // merge other scalar fields
        Object.keys(data).forEach((k) => {
          if (k !== 'serviceRequest') updated[k] = data[k]
        })
        db.bookings[idx] = updated
        return db.bookings[idx]
      })
    },
    serviceRequest: {
      create: vi.fn(async ({ data }: any) => {
        const sr = { id: `sr${db.serviceRequests.length + 1}`, ...data }
        db.serviceRequests.push(sr)
        return sr
      })
    }
  }
}))

describe('admin booking migrate endpoint', () => {
  beforeEach(() => {
    db.bookings = [ { id: 'b1', clientId: 'client1', serviceId: 'svc1', notes: 'note', scheduledAt: new Date().toISOString(), duration: 60 } ]
    db.serviceRequests = []
  })

  it('POST creates service request and links booking', async () => {
    const { POST }: any = await import('@/app/api/admin/bookings/[id]/migrate/route')
    const res: any = await POST(new Request('https://x'), { params: Promise.resolve({ id: 'b1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data?.serviceRequest?.id).toBeDefined()
    expect(json.data?.booking?.serviceRequestId).toBe(json.data.serviceRequest.id)
  })
})

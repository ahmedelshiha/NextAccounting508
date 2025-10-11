import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'client1', role: 'CLIENT' } })),
}))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

const db: any = {
  bookings: [
    { id: 'b1', clientId: 'client1', serviceId: 'svc1', status: 'PENDING', scheduledAt: new Date().toISOString(), duration: 30, notes: 'hello' },
  ],
}

vi.mock('@/lib/prisma', () => ({
  default: {
    booking: {
      findUnique: vi.fn(async ({ where }: any) => db.bookings.find((b: any) => b.id === where.id)),
      update: vi.fn(async ({ where, data }: any) => {
        const idx = db.bookings.findIndex((b: any) => b.id === where.id)
        if (idx === -1) return null
        db.bookings[idx] = { ...db.bookings[idx], ...data }
        return db.bookings[idx]
      }),
    },
  },
}))

// Apply bookings bootstrap
import setupBookings from './setup/bookings.setup'
setupBookings()

describe('api/bookings/[id] route', () => {
  beforeEach(() => {
    db.bookings = [
      { id: 'b1', clientId: 'client1', serviceId: 'svc1', status: 'PENDING', scheduledAt: new Date().toISOString(), duration: 30, notes: 'hello' },
    ]
  })

  it('GET returns booking for owner', async () => {
    const { GET }: any = await import('@/app/api/bookings/[id]/route')
    const res: any = await GET(new Request('https://x'), { params: Promise.resolve({ id: 'b1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeTruthy()
    expect(json.client).toBeDefined()
    expect(json.id).toBe('b1')
  })

  it('PUT allows owner to update notes and reschedule if not confirmed', async () => {
    const { PUT }: any = await import('@/app/api/bookings/[id]/route')
    const body = { notes: 'updated notes', scheduledAt: new Date(Date.now() + 3600 * 1000).toISOString() }
    const req = new Request('https://x', { method: 'PUT', body: JSON.stringify(body) })
    const res: any = await PUT(req, { params: Promise.resolve({ id: 'b1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.notes).toBe('updated notes')
  })

  it('DELETE cancels booking for owner', async () => {
    const { DELETE }: any = await import('@/app/api/bookings/[id]/route')
    const res: any = await DELETE(new Request('https://x'), { params: Promise.resolve({ id: 'b1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBe('Booking cancelled successfully')
  })
})

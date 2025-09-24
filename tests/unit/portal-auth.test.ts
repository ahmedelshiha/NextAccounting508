import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PATCH as patchServiceRequest } from '@/app/api/portal/service-requests/[id]/route'
import { DELETE as deleteBooking } from '@/app/api/bookings/[id]/route'
import { getServerSession } from 'next-auth'

// Mock prisma module
vi.mock('@/lib/prisma', () => ({
  serviceRequest: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  booking: {
    findUnique: vi.fn(),
    update: vi.fn(),
  }
}))

import prisma from '@/lib/prisma'

function makeReq({ url = 'https://app.example.com', headers = {}, body = {} } = {}) {
  return {
    url,
    headers: {
      get(k: string) {
        return headers[k.toLowerCase()] ?? null
      }
    },
    json: async () => body,
    // signal not required for these tests
  } as unknown as Request
}

describe('Portal routes — auth/ownership negative tests', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('PATCH /api/portal/service-requests/:id returns 401 when unauthenticated', async () => {
    // Ensure getServerSession returns null for this case
    vi.mocked(getServerSession).mockResolvedValueOnce(null as any)

    const req = makeReq({ url: 'https://app.example.com/api/portal/service-requests/abc' , body: {} })
    const res: any = await patchServiceRequest(req as any, { params: Promise.resolve({ id: 'abc' }) } as any)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('UNAUTHORIZED')
  })

  it('PATCH /api/portal/service-requests/:id returns 404 when user is not the owner', async () => {
    // Authenticated as user 'user-1'
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: 'user-1' } } as any)
    // prisma returns a record owned by different user
    ;(prisma as any).serviceRequest.findUnique.mockResolvedValueOnce({ id: 'abc', clientId: 'other-user', tenantId: null })

    const req = makeReq({ url: 'https://app.example.com/api/portal/service-requests/abc', body: {} })
    const res: any = await patchServiceRequest(req as any, { params: Promise.resolve({ id: 'abc' }) } as any)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('NOT_FOUND')
  })

  it('DELETE /api/bookings/:id returns 404 for tenant mismatch', async () => {
    // Authenticated as owner client1
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: 'client1' } } as any)
    // Booking exists but tenantId is t2
    ;(prisma as any).booking.findUnique.mockResolvedValueOnce({ id: 'b1', clientId: 'client1', tenantId: 't2', status: 'PENDING' })

    const req = makeReq({ url: 'https://app.example.com/api/bookings/b1', headers: { 'x-tenant-id': 't1' } })
    const res: any = await deleteBooking(req as any, { params: Promise.resolve({ id: 'b1' }) } as any)
    // Expect not found due to tenant mismatch
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('NOT_FOUND')
  })
})

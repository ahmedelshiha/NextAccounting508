import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/booking/recurring', async (orig) => {
  const mod = await (orig as any)()
  return {
    ...mod,
    planRecurringBookings: vi.fn(async ({ start, durationMinutes }: any) => {
      const s = new Date(start)
      const e1 = new Date(s.getTime() + durationMinutes * 60000)
      const s2 = new Date(s.getTime() + 24 * 3600 * 1000)
      const e2 = new Date(s2.getTime() + durationMinutes * 60000)
      return { plan: [
        { start: s, end: e1, conflict: false },
        { start: s2, end: e2, conflict: true, reason: 'OVERLAP' },
      ] }
    }),
  }
})

import { POST } from '@/app/api/portal/service-requests/recurring/preview/route'

function makeReq(body: any) {
  return new Request('https://example.com/api/portal/service-requests/recurring/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/portal/service-requests/recurring/preview', () => {
  it('returns plan and summary', async () => {
    const start = new Date('2025-01-06T09:00:00.000Z').toISOString()
    const req = makeReq({ serviceId: 'svc-1', start, duration: 60, recurringPattern: { frequency: 'DAILY', count: 2 } })
    const res: any = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.data.plan)).toBe(true)
    expect(json.data.summary.total).toBe(2)
    // One conflict mocked
    const created = json.data.plan.filter((p: any) => !p.conflict).length
    expect(created).toBe(1)
  })
})

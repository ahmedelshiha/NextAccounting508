import { describe, it, expect } from 'vitest'
import * as mod from '@/app/api/admin/service-requests/recurring/preview/route'

function req(body: any) {
  return new Request('https://example.com/api/admin/service-requests/recurring/preview', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('admin recurring preview route', () => {
  it('returns a plan with summary', async () => {
    const now = new Date()
    const res: any = await (mod as any).POST(req({
      serviceId: 'svc-1',
      start: new Date(now.getTime() + 24*60*60*1000).toISOString(),
      duration: 60,
      teamMemberId: 'tm-1',
      recurringPattern: { frequency: 'WEEKLY', interval: 1, count: 4, byWeekday: [now.getDay()] },
    }))
    const json = await res.json()
    expect(res.status).toBeLessThan(500)
    expect(json).toBeTruthy()
    const data = json.data || json
    expect(Array.isArray(data.plan)).toBe(true)
    expect(data.summary).toBeTruthy()
    expect(typeof data.summary.total).toBe('number')
  })
})

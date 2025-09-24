import { describe, it, expect, vi } from 'vitest'

// Mock next-auth session to allow access
vi.mock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u', role: 'ADMIN' } })) }))

// Import after mocks
import { GET, POST } from '@/app/api/admin/perf-metrics/route'

function makePostBody(payload: any) {
  return { json: async () => payload } as any
}

describe('perf-metrics API thresholds', () => {
  it('returns thresholds and alerts based on recent samples', async () => {
    // Post several samples exceeding LCP threshold (2500ms)
    for (let i = 0; i < 12; i++) {
      await POST(makePostBody({ ts: Date.now(), path: '/admin', metrics: { lcp: 3000 } }) as any)
    }
    // Post some good samples
    for (let i = 0; i < 8; i++) {
      await POST(makePostBody({ ts: Date.now(), path: '/admin', metrics: { lcp: 1200 } }) as any)
    }

    const res = await GET({} as any)
    const json = await (res as any).json()

    expect(json.thresholds).toBeTruthy()
    expect(json.thresholds.lcp).toBe(2500)
    expect(Array.isArray(json.alerts)).toBe(true)

    // 12/20 = 0.6 > 0.2, should alert on LCP
    const lcpAlert = json.alerts.find((a: any) => a.metric === 'lcp')
    expect(lcpAlert).toBeTruthy()
    expect(lcpAlert.count).toBeGreaterThanOrEqual(12)
    expect(json.status).toBe('alert')
  })
})

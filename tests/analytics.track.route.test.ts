import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/rate-limit', async () => {
  const actual = await vi.importActual<any>('@/lib/rate-limit')
  return {
    ...actual,
    getClientIp: vi.fn(() => '1.2.3.4'),
    applyRateLimit: vi.fn(async () => ({ allowed: true, backend: 'memory', count: 1, limit: 100, remaining: 99, resetAt: Date.now() + 60_000 })),
  }
})

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => ({ ok: true, stored: false })) }))

import { applyRateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'

// Helper to build a Request
function buildRequest(body: any) {
  const url = 'https://example.com/api/analytics/track'
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('api/analytics/track route', () => {
  it('accepts a valid analytics payload and logs audit', async () => {
    const { POST }: any = await import('@/app/api/analytics/track/route')
    const res: Response = await POST(buildRequest({ event: 'consultation_requested', properties: { source: 'test' }, timestamp: Date.now() }) as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(vi.mocked(logAudit)).toHaveBeenCalled()
    const call = vi.mocked(logAudit).mock.calls[0]?.[0]
    expect(call?.action).toBe('analytics:event')
    expect(call?.details?.event).toBe('consultation_requested')
  })

  it('rejects invalid payload with 400', async () => {
    const { POST }: any = await import('@/app/api/analytics/track/route')
    const res: Response = await POST(buildRequest({ event: '', properties: {} }) as any)
    expect(res.status).toBe(400)
  })

  it('rejects payloads over ~8KB with 413', async () => {
    const { POST }: any = await import('@/app/api/analytics/track/route')
    const big = 'x'.repeat(9 * 1024)
    const res: Response = await POST(buildRequest({ event: 'e', properties: { big } }) as any)
    expect(res.status).toBe(413)
  })

  it('applies rate limiting and returns 429 when exceeded', async () => {
    vi.mocked(applyRateLimit).mockResolvedValueOnce({ allowed: false, backend: 'memory', count: 101, limit: 100, remaining: 0, resetAt: Date.now() + 1_000 })
    const { POST }: any = await import('@/app/api/analytics/track/route')
    const res: Response = await POST(buildRequest({ event: 'e' }) as any)
    expect(res.status).toBe(429)
  })
})

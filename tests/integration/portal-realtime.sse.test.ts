import { describe, it, expect } from 'vitest'

describe('portal realtime SSE route', () => {
  it('returns text/event-stream on GET', async () => {
    const mod = await import('@/app/api/portal/realtime/route')
    const { GET } = mod as any
    const res = await GET(new Request('https://example.com/api/portal/realtime'))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toMatch(/text\/event-stream/)
  })
})

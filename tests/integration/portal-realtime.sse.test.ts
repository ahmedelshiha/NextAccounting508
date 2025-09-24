import { describe, it, expect } from 'vitest'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'client1', role: 'CLIENT' } })),
}))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({
  default: {
    healthLog: { create: vi.fn(async () => ({})) },
  }
}))
vi.mock('@/lib/realtime-enhanced', () => ({
  realtimeService: {
    subscribe: vi.fn(() => 'conn-1'),
    cleanup: vi.fn(() => {}),
  },
}))

function makeReq(url = 'https://example.com/api/portal/realtime') {
  return new Request(url)
}

describe('portal realtime SSE route', () => {
  it('returns 200 with text/event-stream on GET', async () => {
    const { GET }: any = await import('@/app/api/portal/realtime/route')
    const res: Response = await GET(makeReq())
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toMatch(/text\/event-stream/)
    expect(res.headers.get('Cache-Control')).toMatch(/no-cache/)
  })

  it('returns 204 with Allow on OPTIONS', async () => {
    const { OPTIONS }: any = await import('@/app/api/portal/realtime/route')
    const res: Response = await OPTIONS()
    expect(res.status).toBe(204)
    expect(res.headers.get('Allow')).toBe('GET,OPTIONS')
  })
})

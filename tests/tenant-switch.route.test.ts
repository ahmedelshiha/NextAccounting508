import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { expect, it, describe, beforeAll } from 'vitest'

let POST: (request: Request) => Promise<Response>

beforeAll(async () => {
  const mod = await import('@/app/api/tenant/switch/route')
  POST = mod.POST as unknown as (request: Request) => Promise<Response>
})

describe('POST /api/tenant/switch (deprecated)', () => {
  it('returns 410 Gone to indicate endpoint removal', async () => {
    const request = new Request('https://app.local/api/tenant/switch', { method: 'POST' })
    const response = await POST(request)
    expect(response.status).toBe(410)
    const payload = await response.json()
    expect(payload.error).toMatch(/removed/i)
  })
})

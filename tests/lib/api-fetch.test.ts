import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiFetch } from '@/lib/api'

describe('apiFetch', () => {
  const realFetch = global.fetch
  beforeEach(() => { (global as any).fetch = vi.fn() })
  afterEach(() => { (global as any).fetch = realFetch })

  it('returns 503 Response when fetch throws (network error/timeout)', async () => {
    ;(global as any).fetch.mockImplementation(() => { throw new Error('Failed to fetch') })
    const res = await apiFetch('/test')
    expect(res.status).toBe(503)
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { scanBuffer } from '@/lib/clamav'

describe('scanBuffer', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...OLD_ENV }
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    process.env = OLD_ENV
    vi.resetAllMocks()
  })

  it('returns clean when AV responds with status clean', async () => {
    process.env.UPLOADS_AV_SCAN_URL = 'https://av.test/scan'
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'clean' })
    })

    const buf = Buffer.from('hello')
    const res = await scanBuffer(buf)
    expect(res.clean).toBe(true)
    expect(res.details.status).toBe('clean')
  })

  it('throws when AV returns non-ok and not clean', async () => {
    process.env.UPLOADS_AV_SCAN_URL = 'https://av.test/scan'
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ status: 'error' })
    })
    const buf = Buffer.from('hello')
    await expect(scanBuffer(buf)).rejects.toBeDefined()
  })
})

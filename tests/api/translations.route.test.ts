import { describe, it, expect } from 'vitest'

describe('translations API route', () => {
  it('GET returns JSON and cache headers for en locale', async () => {
    const mod = await import('@/app/api/translations/[locale]/route')
    // Call GET with mock params
    const res: any = await mod.GET(new Request('https://example.com'), { params: { locale: 'en' } })
    expect(res).toBeDefined()
    // Response should have json() method
    const json = await res.json()
    expect(typeof json).toBe('object')
    const cache = res.headers.get('Cache-Control')
    expect(cache).toBeDefined()
    expect(cache).toContain('max-age=86400')
  })
})

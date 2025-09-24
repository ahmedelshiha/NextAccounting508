import { buildUnifiedPath } from '@/hooks/useUnifiedData'

describe('buildUnifiedPath', () => {
  it('prefixes relative keys with /api/admin', () => {
    expect(buildUnifiedPath('health-history')).toBe('/api/admin/health-history')
  })

  it('keeps absolute keys untouched', () => {
    expect(buildUnifiedPath('/api/admin/stats?x=1')).toBe('/api/admin/stats?x=1')
  })

  it('serializes params and skips null/undefined', () => {
    const p = buildUnifiedPath('stats', { a: 1, b: 'x', c: false, d: null as any, e: undefined as any })
    expect(p === '/api/admin/stats?a=1&b=x&c=false' || p === '/api/admin/stats?b=x&a=1&c=false').toBe(true)
  })
})

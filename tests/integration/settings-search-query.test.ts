import { describe, it, expect } from 'vitest'
import handlerModule from '@/app/api/admin/settings/search/route'

describe('Settings search route with query', () => {
  it('returns results for common query', async () => {
    const req = new Request('http://localhost/api/admin/settings/search?q=org')
    const res = await (handlerModule.GET as any)(req as any, { params: {} })
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.data).toBeDefined()
    expect(typeof json.data.total).toBe('number')
  })
})

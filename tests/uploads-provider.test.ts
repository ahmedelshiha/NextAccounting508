import { describe, it, expect } from 'vitest'

import * as provider from '@/lib/uploads-provider'

describe('uploads-provider helper - no provider configured', () => {
  it('listQuarantine returns empty array when no provider', async () => {
    process.env.UPLOADS_PROVIDER = ''
    const items = await provider.listQuarantine()
    expect(Array.isArray(items)).toBeTruthy()
    expect(items.length).toBe(0)
  })

  it('getObject returns null when no provider', async () => {
    process.env.UPLOADS_PROVIDER = ''
    const obj = await provider.getObject('nonexistent-key')
    expect(obj).toBeNull()
  })
})

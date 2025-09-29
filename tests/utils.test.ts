import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('utils.cn', () => {
  it('concatenates classes', () => {
    const out = cn('a', 'b', 'c')
    expect(typeof out).toBe('string')
    expect(out.split(' ')).toEqual(expect.arrayContaining(['a','b','c']))
  })

  it('handles falsy values gracefully', () => {
    const out = cn('a', false as any, undefined as any, 'b')
    expect(out).toContain('a')
    expect(out).toContain('b')
  })
})

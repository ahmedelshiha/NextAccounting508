import { describe, it, expect } from 'vitest'
import { isIpAllowed } from '@/lib/security/ip-allowlist'

describe('ip-allowlist', () => {
  it('allows any when list empty or wildcard', () => {
    expect(isIpAllowed('1.2.3.4', [])).toBe(true)
    expect(isIpAllowed('1.2.3.4', ['*'])).toBe(true)
  })

  it('matches exact IPv4', () => {
    expect(isIpAllowed('203.0.113.5', ['203.0.113.5'])).toBe(true)
    expect(isIpAllowed('203.0.113.6', ['203.0.113.5'])).toBe(false)
  })

  it('matches IPv4 CIDR range', () => {
    const allow = ['203.0.113.0/24']
    expect(isIpAllowed('203.0.113.1', allow)).toBe(true)
    expect(isIpAllowed('203.0.114.1', allow)).toBe(false)
  })

  it('handles IPv4-mapped IPv6', () => {
    const ip = '::ffff:198.51.100.10'
    expect(isIpAllowed(ip, ['198.51.100.10'])).toBe(true)
    expect(isIpAllowed(ip, ['198.51.100.0/24'])).toBe(true)
  })

  it('matches exact IPv6 by string', () => {
    const v6 = '2001:db8::1'
    expect(isIpAllowed(v6, ['2001:db8::1'])).toBe(true)
    expect(isIpAllowed(v6, ['2001:db8::2'])).toBe(false)
  })
})

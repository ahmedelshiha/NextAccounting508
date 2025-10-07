import { describe, it, expect } from 'vitest'
import isIpAllowed from '@/lib/security/ip-allowlist'

describe('ip-allowlist matcher', () => {
  it('allows when allowlist empty', () => {
    expect(isIpAllowed('1.2.3.4', [])).toBe(true)
  })

  it('matches wildcard', () => {
    expect(isIpAllowed('1.2.3.4', ['*'])).toBe(true)
  })

  it('matches exact ipv4', () => {
    expect(isIpAllowed('1.2.3.4', ['1.2.3.4'])).toBe(true)
  })

  it('matches ipv4 cidr', () => {
    expect(isIpAllowed('192.168.1.5', ['192.168.1.0/24'])).toBe(true)
    expect(isIpAllowed('192.168.2.5', ['192.168.1.0/24'])).toBe(false)
  })

  it('handles ipv4-mapped ipv6 addresses', () => {
    expect(isIpAllowed('::ffff:203.0.113.5', ['203.0.113.0/24'])).toBe(true)
  })

  it('matches exact ipv6', () => {
    expect(isIpAllowed('2001:db8::1', ['2001:db8::1'])).toBe(true)
  })

  it('matches ipv6 cidr', () => {
    // 2001:db8::/32 should match addresses in that /32
    expect(isIpAllowed('2001:db8:0:1::1', ['2001:db8::/32'])).toBe(true)
    expect(isIpAllowed('2001:0db9::1', ['2001:db8::/32'])).toBe(false)
  })

  it('matches compressed ipv6 in cidr', () => {
    expect(isIpAllowed('2001:db8::abcd', ['2001:db8:0:0:0:0:0:0/48'])).toBe(true)
  })
})

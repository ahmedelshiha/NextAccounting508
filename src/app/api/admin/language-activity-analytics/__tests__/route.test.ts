import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detectDeviceFromUA, regionFromProfile, normalizeCountryName, handler } from '../route'

// Mock prisma
vi.mock('@/lib/prisma', () => {
  return {
    default: {
      auditLog: {
        findMany: vi.fn(),
      },
      userProfile: {
        findMany: vi.fn(),
      },
    },
  }
})

// Mock tenant utils and permissions
vi.mock('@/lib/tenant-utils', () => ({
  requireTenantContext: () => ({ userId: 'u1', role: 'admin', tenantId: 't1' }),
  withTenantContext: (fn: any) => fn,
}))

vi.mock('@/lib/permissions', () => ({
  hasPermission: () => true,
  PERMISSIONS: { ANALYTICS_VIEW: 'analytics_view' },
}))

import prisma from '@/lib/prisma'

describe('detectDeviceFromUA', () => {
  it('detects mobile', () => {
    expect(detectDeviceFromUA('Mozilla/5.0 (iPhone; CPU iPhone OS 13_3 like Mac OS X)')).toBe('mobile')
  })
  it('detects tablet', () => {
    expect(detectDeviceFromUA('Mozilla/5.0 (iPad; CPU OS 13_4 like Mac OS X)')).toBe('tablet')
  })
  it('detects desktop', () => {
    expect(detectDeviceFromUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('desktop')
  })
  it('returns unknown for empty ua', () => {
    expect(detectDeviceFromUA(null)).toBe('unknown')
  })
})

describe('normalizeCountryName & regionFromProfile', () => {
  it('maps full country names to ISO', () => {
    expect(normalizeCountryName('United States')).toBe('us')
    expect(normalizeCountryName('UNITED KINGDOM')).toBe('gb')
    expect(normalizeCountryName('Saudi Arabia')).toBe('sa')
  })

  it('returns null for unknown countries', () => {
    expect(normalizeCountryName('Wakanda')).toBeNull()
  })

  it('regionFromProfile uses country meta normalized', () => {
    expect(regionFromProfile({ metadata: { country: 'United States' } })).toBe('us')
    expect(regionFromProfile({ metadata: { country: 'US' } })).toBe('us')
  })

  it('falls back to timezone when country not present', () => {
    expect(regionFromProfile({ timezone: 'Europe/London' })).toBe('europe')
  })
})

describe('analytics handler edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles audit log entries with missing userAgent and malformed metadata', async () => {
    const now = new Date()
    const earlier = new Date(now.getTime() - 1000 * 60 * 60)

    ;(prisma.auditLog.findMany as any).mockResolvedValueOnce([
      {
        createdAt: now.toISOString(),
        metadata: 'not-an-object',
        userAgent: null,
        userId: 'u4',
      },
      {
        createdAt: now.toISOString(),
        metadata: { to: 'fr' },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        userId: 'u5',
      },
    ])

    ;(prisma.userProfile.findMany as any)
      .mockResolvedValueOnce([
        { preferredLanguage: 'fr', user: { id: 'u5', createdAt: earlier.toISOString() }, timezone: 'Europe/Paris', metadata: { country: 'FR' } },
      ])
      // snapshot profiles
      .mockResolvedValueOnce([
        { preferredLanguage: 'en', user: { id: 'u6', createdAt: earlier.toISOString() }, timezone: 'UTC', metadata: {} },
      ])

    const req = new Request('https://example.com/api/admin/language-activity-analytics?days=1')
    const res = await handler(req)
    const json = await res.json()

    expect(json.success).toBe(true)
    // one mobile/desktop unknown entry should be handled without throwing
    expect(json.data.summary.totalSessions).toBeGreaterThanOrEqual(1)
    // ensure availableDevices includes 'unknown' for missing UA
    expect(json.data.meta.availableDevices).toContain('unknown')
  })

  it('applies language filter correctly', async () => {
    const now = new Date()

    ;(prisma.auditLog.findMany as any).mockResolvedValueOnce([
      { createdAt: now.toISOString(), metadata: { to: 'es' }, userAgent: 'ua', userId: 'ua1' },
      { createdAt: now.toISOString(), metadata: { to: 'fr' }, userAgent: 'ua', userId: 'ua2' },
    ])

    ;(prisma.userProfile.findMany as any)
      .mockResolvedValueOnce([
        { preferredLanguage: 'es', user: { id: 'ua1', createdAt: now.toISOString() }, timezone: 'Europe/Madrid', metadata: { country: 'ES' } },
        { preferredLanguage: 'fr', user: { id: 'ua2', createdAt: now.toISOString() }, timezone: 'Europe/Paris', metadata: { country: 'FR' } },
      ])
      .mockResolvedValueOnce([])

    const req = new Request('https://example.com/api/admin/language-activity-analytics?days=1&languages=es')
    const res = await handler(req)
    const json = await res.json()

    expect(json.success).toBe(true)
    // only spanish should be in availableLanguages
    expect(json.data.meta.availableLanguages).toContain('es')
    expect(json.data.meta.availableLanguages).not.toContain('fr')
  })
})

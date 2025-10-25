import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detectDeviceFromUA, regionFromProfile } from '../route'
import { handler } from '../route'

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

describe('regionFromProfile', () => {
  it('prefers country code', () => {
    expect(regionFromProfile({ metadata: { country: 'US' } })).toBe('us')
  })
  it('falls back to timezone', () => {
    expect(regionFromProfile({ timezone: 'America/Los_Angeles' })).toBe('america')
  })
  it('returns unknown if none', () => {
    expect(regionFromProfile({})).toBe('unknown')
  })
})

describe('analytics handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns aggregated response for audit logs and profiles', async () => {
    const now = new Date()
    const earlier = new Date(now.getTime() - 1000 * 60 * 60)

    ;(prisma.auditLog.findMany as any).mockResolvedValueOnce([
      {
        createdAt: now.toISOString(),
        metadata: { to: 'ar' },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_3 like Mac OS X)',
        userId: 'u2',
      },
    ])

    ;(prisma.userProfile.findMany as any)
      .mockResolvedValueOnce([
        { preferredLanguage: 'ar', user: { id: 'u2', createdAt: earlier.toISOString() }, timezone: 'Asia/Riyadh', metadata: { country: 'SA' } },
      ])
      // for snapshot call
      .mockResolvedValueOnce([
        { preferredLanguage: 'en', user: { id: 'u3', createdAt: earlier.toISOString() }, timezone: 'UTC', metadata: {} },
      ])

    const req = new Request('https://example.com/api/admin/language-activity-analytics?days=1')
    const res = await handler(req)
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.data.summary.totalSessions).toBeGreaterThanOrEqual(1)
    expect(json.data.meta.availableDevices).toContain('mobile')
    expect(json.data.meta.availableRegions).toContain('sa')
  })
})

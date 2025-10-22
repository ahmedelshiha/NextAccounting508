import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/user/preferences/route'

// Mock dependencies similar to existing tests
vi.mock('@/lib/tenant-utils', () => ({
  requireTenantContext: vi.fn(() => ({
    userId: 'user-1',
    userEmail: 'test@example.com',
    tenantId: 'tenant-1',
  })),
}))

vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findFirst: vi.fn() },
    userProfile: { upsert: vi.fn() },
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  applyRateLimit: vi.fn(async () => ({ allowed: true })),
  getClientIp: vi.fn(() => '127.0.0.1'),
}))

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }))

import prisma from '@/lib/prisma'

describe('User Preferences API Route - error cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 500 when prisma.upsert throws', async () => {
    ;(prisma.user.findFirst as any).mockResolvedValueOnce({ id: 'user-1' })
    ;(prisma.userProfile.upsert as any).mockRejectedValueOnce(new Error('DB failure'))

    const request = new NextRequest('http://localhost:3000/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify({ timezone: 'UTC' }),
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error).toBeTruthy()
  })

  it('returns 429 when rate limit exceeded', async () => {
    const rl = await import('@/lib/rate-limit')
    ;(rl.applyRateLimit as any).mockResolvedValueOnce({ allowed: false })

    const request = new NextRequest('http://localhost:3000/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify({ timezone: 'UTC' }),
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(429)
    expect(json.error).toBe('Rate limit exceeded')
  })
})

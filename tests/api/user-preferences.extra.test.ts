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

  it('returns 500 when prisma.upsert throws with Prisma error', async () => {
    ;(prisma.user.findFirst as any).mockResolvedValueOnce({ id: 'user-1' })
    ;(prisma.userProfile.upsert as any).mockRejectedValueOnce(new Error('DB failure: type mismatch'))

    const request = new NextRequest('http://localhost:3000/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify({ timezone: 'UTC' }),
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error).toContain('database error')
  })

  it('returns 500 when prisma.user.findFirst throws', async () => {
    ;(prisma.user.findFirst as any).mockRejectedValueOnce(new Error('Connection timeout'))

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

  it('returns 404 when user not found during PUT', async () => {
    ;(prisma.user.findFirst as any).mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify({ timezone: 'UTC' }),
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toBe('User not found')
  })

  it('returns 400 for malformed JSON body', async () => {
    const request = new NextRequest('http://localhost:3000/api/user/preferences', {
      method: 'PUT',
      body: 'invalid json',
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBeTruthy()
  })

  it('handles database error with "Database is not configured"', async () => {
    ;(prisma.user.findFirst as any).mockRejectedValueOnce(new Error('Database is not configured'))

    const request = new NextRequest('http://localhost:3000/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify({ timezone: 'UTC' }),
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(503)
    expect(json.error).toBe('Database is not configured')
  })
})

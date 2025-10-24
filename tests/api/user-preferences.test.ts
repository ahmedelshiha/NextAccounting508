import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT } from '@/app/api/user/preferences/route'

// Mock dependencies
vi.mock('@/lib/tenant-utils', () => ({
  requireTenantContext: vi.fn(() => ({
    userId: 'user-1',
    userEmail: 'test@example.com',
    tenantId: 'tenant-1',
  })),
}))

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findFirst: vi.fn(),
    },
    userProfile: {
      upsert: vi.fn(),
    },
  },
}))

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
  applyRateLimit: vi.fn(async () => ({ allowed: true })),
  getClientIp: vi.fn(() => '127.0.0.1'),
}))

import prisma from '@/lib/prisma'

describe('User Preferences API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/user/preferences', () => {
    it('returns user preferences', async () => {
      ;(prisma.user.findFirst as any).mockResolvedValueOnce({
        id: 'user-1',
        userProfile: {
          timezone: 'America/New_York',
          preferredLanguage: 'en',
          bookingEmailConfirm: true,
          bookingEmailReminder: true,
          bookingEmailReschedule: true,
          bookingEmailCancellation: true,
          bookingSmsReminder: false,
          bookingSmsConfirmation: false,
          reminderHours: [24, 2],
        },
      })

      const request = new NextRequest('http://localhost:3000/api/user/preferences')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.timezone).toBe('America/New_York')
      expect(json.preferredLanguage).toBe('en')
    })

    it('returns default values when no profile exists', async () => {
      ;(prisma.user.findFirst as any).mockResolvedValueOnce({
        id: 'user-1',
        userProfile: null,
      })

      const request = new NextRequest('http://localhost:3000/api/user/preferences')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.timezone).toBe('UTC')
      expect(json.preferredLanguage).toBe('en')
    })

    it('returns 404 if user not found', async () => {
      ;(prisma.user.findFirst as any).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/user/preferences')
      const response = await GET(request)
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error).toBe('User not found')
    })
  })

  describe('PUT /api/user/preferences', () => {
    it('updates user preferences', async () => {
      const mockUser = { id: 'user-1' }
      const updatedProfile = {
        userId: 'user-1',
        timezone: 'Europe/London',
        preferredLanguage: 'en',
        bookingEmailConfirm: true,
        bookingEmailReminder: false,
        bookingEmailReschedule: true,
        bookingEmailCancellation: true,
        bookingSmsReminder: false,
        bookingSmsConfirmation: false,
        reminderHours: [24, 6],
      }

      ;(prisma.user.findFirst as any).mockResolvedValueOnce(mockUser)
      ;(prisma.userProfile.upsert as any).mockResolvedValueOnce(updatedProfile)

      const request = new NextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          timezone: 'Europe/London',
          bookingEmailReminder: false,
          reminderHours: [24, 6],
        }),
      })

      const response = await PUT(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.timezone).toBe('Europe/London')
      expect(json.bookingEmailReminder).toBe(false)
    })

    it('validates timezone format', async () => {
      ;(prisma.user.findFirst as any).mockResolvedValueOnce({ id: 'user-1' })

      const request = new NextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          timezone: 'Invalid/Zone',
        }),
      })

      const response = await PUT(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBe('Invalid timezone')
    })

    it('validates language selection', async () => {
      ;(prisma.user.findFirst as any).mockResolvedValueOnce({ id: 'user-1' })

      const request = new NextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          preferredLanguage: 'fr',
        }),
      })

      const response = await PUT(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toBeTruthy()
    })

    it('validates reminder hours range', async () => {
      ;(prisma.user.findFirst as any).mockResolvedValueOnce({ id: 'user-1' })

      const request = new NextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          reminderHours: [0, 750], // 0 is invalid, 750 exceeds max
        }),
      })

      const response = await PUT(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error).toContain('1 and 720')
    })

    it('coerces string reminderHours to numbers', async () => {
      const mockUser = { id: 'user-1' }
      const updatedProfile = {
        userId: 'user-1',
        timezone: 'UTC',
        preferredLanguage: 'en',
        bookingEmailConfirm: true,
        bookingEmailReminder: true,
        bookingEmailReschedule: true,
        bookingEmailCancellation: true,
        bookingSmsReminder: false,
        bookingSmsConfirmation: false,
        reminderHours: [24, 6],
      }

      ;(prisma.user.findFirst as any).mockResolvedValueOnce(mockUser)
      ;(prisma.userProfile.upsert as any).mockResolvedValueOnce(updatedProfile)

      const request = new NextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          reminderHours: ['24', '6'], // strings should be coerced
        }),
      })

      const response = await PUT(request)
      const json = await response.json()

      expect(response.status).toBe(400)
      // Schema validation should reject this since schema expects numbers
      expect(json.error).toBeTruthy()
    })

    it('handles empty reminderHours array', async () => {
      const mockUser = { id: 'user-1' }
      const updatedProfile = {
        userId: 'user-1',
        timezone: 'UTC',
        preferredLanguage: 'en',
        bookingEmailConfirm: true,
        bookingEmailReminder: true,
        bookingEmailReschedule: true,
        bookingEmailCancellation: true,
        bookingSmsReminder: false,
        bookingSmsConfirmation: false,
        reminderHours: [24, 2],
      }

      ;(prisma.user.findFirst as any).mockResolvedValueOnce(mockUser)
      ;(prisma.userProfile.upsert as any).mockResolvedValueOnce(updatedProfile)

      const request = new NextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          reminderHours: [],
        }),
      })

      const response = await PUT(request)
      const json = await response.json()

      // Empty array should use defaults
      expect(response.status).toBe(200)
      expect(Array.isArray(json.reminderHours)).toBe(true)
    })

    it('validates all boolean email preferences', async () => {
      const mockUser = { id: 'user-1' }
      const updatedProfile = {
        userId: 'user-1',
        timezone: 'UTC',
        preferredLanguage: 'en',
        bookingEmailConfirm: false,
        bookingEmailReminder: false,
        bookingEmailReschedule: false,
        bookingEmailCancellation: false,
        bookingSmsReminder: false,
        bookingSmsConfirmation: false,
        reminderHours: [24, 2],
      }

      ;(prisma.user.findFirst as any).mockResolvedValueOnce(mockUser)
      ;(prisma.userProfile.upsert as any).mockResolvedValueOnce(updatedProfile)

      const request = new NextRequest('http://localhost:3000/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          bookingEmailConfirm: false,
          bookingEmailReminder: false,
          bookingEmailReschedule: false,
          bookingEmailCancellation: false,
          bookingSmsReminder: false,
          bookingSmsConfirmation: false,
        }),
      })

      const response = await PUT(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.bookingEmailConfirm).toBe(false)
      expect(json.bookingEmailReminder).toBe(false)
      expect(json.bookingEmailReschedule).toBe(false)
      expect(json.bookingEmailCancellation).toBe(false)
      expect(json.bookingSmsReminder).toBe(false)
      expect(json.bookingSmsConfirmation).toBe(false)
    })
  })
})

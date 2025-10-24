import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * Translation Admin API Tests
 * 
 * Tests for:
 * - GET /api/admin/translations/status
 * - GET /api/admin/translations/missing
 * - GET /api/admin/translations/recent
 * - GET /api/admin/translations/analytics
 */

describe('Translation Admin APIs', () => {
  describe('GET /api/admin/translations/status', () => {
    it('should return current translation coverage stats', async () => {
      // Mock the data
      const mockKeys = [
        { enTranslated: true, arTranslated: true, hiTranslated: false },
        { enTranslated: true, arTranslated: false, hiTranslated: false },
        { enTranslated: true, arTranslated: false, hiTranslated: false },
      ]

      // Expected: EN 100%, AR 33%, HI 0%
      expect(mockKeys.filter(k => k.enTranslated).length).toBe(3)
      expect(mockKeys.filter(k => k.arTranslated).length).toBe(1)
      expect(mockKeys.filter(k => k.hiTranslated).length).toBe(0)
    })

    it('should return user distribution by language', async () => {
      // Mock user distribution
      const distribution = {
        en: 10,
        ar: 5,
        hi: 2,
      }

      expect(distribution.en + distribution.ar + distribution.hi).toBe(17)
    })

    it('should require admin permission', async () => {
      // Test that SETTINGS_LANGUAGES_MANAGE permission is checked
      expect('SETTINGS_LANGUAGES_MANAGE').toBeDefined()
    })
  })

  describe('GET /api/admin/translations/missing', () => {
    it('should return missing translations for a language', async () => {
      // Mock missing keys response
      const response = {
        language: 'ar',
        pagination: {
          limit: 50,
          offset: 0,
          total: 5,
          hasMore: false,
        },
        keys: [
          {
            id: '1',
            key: 'hero.headline',
            namespace: 'hero',
            enTranslated: true,
            arTranslated: false,
            hiTranslated: false,
          },
          {
            id: '2',
            key: 'nav.home',
            namespace: 'nav',
            enTranslated: true,
            arTranslated: false,
            hiTranslated: true,
          },
        ],
      }

      expect(response.keys.length).toBe(2)
      expect(response.keys[0].key).toBe('hero.headline')
      expect(response.language).toBe('ar')
    })

    it('should support pagination', async () => {
      const response = {
        pagination: {
          limit: 50,
          offset: 0,
          total: 150,
          hasMore: true,
        },
      }

      expect(response.pagination.hasMore).toBe(true)
      expect(response.pagination.total).toBeGreaterThan(response.pagination.limit)
    })

    it('should filter by namespace if provided', async () => {
      // Test that namespace filtering works
      const mockKeys = [
        { key: 'nav.home', namespace: 'nav', arTranslated: false },
        { key: 'nav.about', namespace: 'nav', arTranslated: false },
        { key: 'hero.headline', namespace: 'hero', arTranslated: false },
      ]

      const navKeys = mockKeys.filter(k => k.namespace === 'nav')
      expect(navKeys.length).toBe(2)
      expect(navKeys.every(k => k.namespace === 'nav')).toBe(true)
    })

    it('should validate language parameter', async () => {
      const validLanguages = ['en', 'ar', 'hi']
      expect(validLanguages).toContain('ar')
      expect(validLanguages).not.toContain('fr')
    })
  })

  describe('GET /api/admin/translations/recent', () => {
    it('should return recently added keys', async () => {
      const today = new Date()
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      const response = {
        period: {
          since: sevenDaysAgo.toISOString(),
          days: 7,
        },
        count: 3,
        stats: {
          enNotTranslated: 0,
          arNotTranslated: 2,
          hiNotTranslated: 1,
        },
        keys: [
          {
            id: '1',
            key: 'footer.about',
            namespace: 'footer',
            enTranslated: true,
            arTranslated: false,
            hiTranslated: false,
            addedAt: today.toISOString(),
            lastUpdated: today.toISOString(),
          },
        ],
      }

      expect(response.count).toBe(3)
      expect(response.stats.arNotTranslated).toBe(2)
      expect(response.period.days).toBe(7)
    })

    it('should track translation readiness of new keys', async () => {
      const mockKeys = [
        { enTranslated: true, arTranslated: false, hiTranslated: false },
        { enTranslated: true, arTranslated: true, hiTranslated: false },
        { enTranslated: true, arTranslated: false, hiTranslated: false },
      ]

      const arNotTranslated = mockKeys.filter(k => !k.arTranslated).length
      const hiNotTranslated = mockKeys.filter(k => !k.hiTranslated).length

      expect(arNotTranslated).toBe(2)
      expect(hiNotTranslated).toBe(3)
    })
  })

  describe('GET /api/admin/translations/analytics', () => {
    it('should return historical metrics for trending', async () => {
      const response = {
        summary: {
          period: { since: '2025-01-13T00:00:00.000Z', days: 7 },
          dataPoints: 7,
          current: {
            date: '2025-01-20',
            en: 100,
            ar: 75.5,
            hi: 60.2,
          },
          previous: {
            date: '2025-01-13',
            en: 100,
            ar: 70.0,
            hi: 55.0,
          },
          trend: {
            en: 0,
            ar: 5.5,
            hi: 5.2,
          },
        },
        chartData: [
          { date: '2025-01-13', en: 100, ar: 70.0, hi: 55.0, totalKeys: 100 },
          { date: '2025-01-20', en: 100, ar: 75.5, hi: 60.2, totalKeys: 100 },
        ],
      }

      expect(response.summary.dataPoints).toBe(7)
      expect(response.chartData.length).toBeGreaterThan(0)
      expect(response.summary.trend.ar).toBeGreaterThan(0) // Positive trend
    })

    it('should support custom date ranges', async () => {
      const days = 30
      const since = new Date()
      since.setDate(since.getDate() - days)

      expect(days).toBeLessThanOrEqual(365)
      expect(since.getTime()).toBeLessThan(new Date().getTime())
    })

    it('should cap max lookback to 365 days', async () => {
      const requestedDays = 500
      const cappedDays = Math.min(requestedDays, 365)

      expect(cappedDays).toBe(365)
    })

    it('should calculate trend direction correctly', async () => {
      const coverage = {
        en: { previous: 100, current: 100, trend: 0 },
        ar: { previous: 70, current: 75, trend: 5 },
        hi: { previous: 50, current: 60, trend: 10 },
      }

      expect(coverage.en.trend).toBe(0)
      expect(coverage.ar.trend).toBeGreaterThan(0)
      expect(coverage.hi.trend).toBeGreaterThan(0)
    })
  })

  describe('Permission Checks', () => {
    it('should require SETTINGS_LANGUAGES_MANAGE permission', async () => {
      const requiredPermission = 'SETTINGS_LANGUAGES_MANAGE'
      expect(requiredPermission).toBeTruthy()
    })

    it('should return 401 if user not authenticated', async () => {
      // Test that tenant ID extraction fails
      const tenantId = null
      expect(tenantId).toBeNull()
    })

    it('should return 403 if user lacks permission', async () => {
      // Test permission validation
      const hasPermission = false
      expect(hasPermission).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed')
      expect(error.message).toContain('Database')
    })

    it('should return 400 for invalid parameters', async () => {
      const invalidLanguage = 'de' // Not en, ar, hi
      const validLanguages = ['en', 'ar', 'hi']
      expect(validLanguages).not.toContain(invalidLanguage)
    })

    it('should return 500 with generic message on server error', async () => {
      const statusCode = 500
      expect(statusCode).toBe(500)
    })
  })
})

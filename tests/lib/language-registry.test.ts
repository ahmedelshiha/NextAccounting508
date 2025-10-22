import { describe, it, expect, beforeEach, vi } from 'vitest'
import prisma from '@/lib/prisma'
import {
  getAllLanguages,
  getEnabledLanguages,
  getLanguageByCode,
  isLanguageEnabled,
  getEnabledLanguageCodes,
  clearLanguageCache,
  upsertLanguage,
  toggleLanguageStatus,
} from '@/lib/language-registry'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    language: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    userProfile: {
      count: vi.fn(),
    },
  },
}))

describe('Language Registry Service', () => {
  beforeEach(() => {
    clearLanguageCache()
    vi.clearAllMocks()
  })

  describe('getAllLanguages', () => {
    it('should fetch all languages from database', async () => {
      const mockLanguages = [
        {
          code: 'en',
          name: 'English',
          nativeName: 'English',
          direction: 'ltr',
          flag: '🇺🇸',
          bcp47Locale: 'en-US',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          code: 'ar',
          name: 'Arabic',
          nativeName: 'العربية',
          direction: 'rtl',
          flag: '🇸🇦',
          bcp47Locale: 'ar-SA',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.language.findMany).mockResolvedValue(mockLanguages)

      const result = await getAllLanguages()

      expect(result).toHaveLength(2)
      expect(result[0].code).toBe('en')
      expect(result[1].code).toBe('ar')
      expect(prisma.language.findMany).toHaveBeenCalled()
    })

    it('should use cache on second call', async () => {
      const mockLanguages = [
        {
          code: 'en',
          name: 'English',
          nativeName: 'English',
          direction: 'ltr',
          flag: '🇺🇸',
          bcp47Locale: 'en-US',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.language.findMany).mockResolvedValue(mockLanguages)

      // First call
      await getAllLanguages()
      // Second call
      await getAllLanguages()

      // Should only call database once (cache hit on second call)
      expect(prisma.language.findMany).toHaveBeenCalledTimes(1)
    })

    it('should return fallback on database error', async () => {
      vi.mocked(prisma.language.findMany).mockRejectedValue(new Error('DB Error'))

      const result = await getAllLanguages()

      expect(result).toHaveLength(3)
      expect(result.map((l) => l.code)).toEqual(['en', 'ar', 'hi'])
    })
  })

  describe('getEnabledLanguages', () => {
    it('should return only enabled languages', async () => {
      const mockLanguages = [
        {
          code: 'en',
          name: 'English',
          nativeName: 'English',
          direction: 'ltr',
          flag: '🇺🇸',
          bcp47Locale: 'en-US',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          code: 'fr',
          name: 'French',
          nativeName: 'Français',
          direction: 'ltr',
          flag: '🇫🇷',
          bcp47Locale: 'fr-FR',
          enabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.language.findMany).mockResolvedValue(mockLanguages)

      const result = await getEnabledLanguages()

      expect(result).toHaveLength(1)
      expect(result[0].code).toBe('en')
    })
  })

  describe('getLanguageByCode', () => {
    it('should return language by code', async () => {
      const mockLanguages = [
        {
          code: 'en',
          name: 'English',
          nativeName: 'English',
          direction: 'ltr',
          flag: '🇺🇸',
          bcp47Locale: 'en-US',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          code: 'ar',
          name: 'Arabic',
          nativeName: 'العربية',
          direction: 'rtl',
          flag: '🇸🇦',
          bcp47Locale: 'ar-SA',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.language.findMany).mockResolvedValue(mockLanguages)

      const result = await getLanguageByCode('ar')

      expect(result?.code).toBe('ar')
      expect(result?.direction).toBe('rtl')
    })

    it('should return null for non-existent code', async () => {
      vi.mocked(prisma.language.findMany).mockResolvedValue([])

      const result = await getLanguageByCode('xx')

      expect(result).toBeNull()
    })
  })

  describe('isLanguageEnabled', () => {
    it('should return true for enabled language', async () => {
      const mockLanguages = [
        {
          code: 'en',
          name: 'English',
          nativeName: 'English',
          direction: 'ltr',
          flag: '🇺🇸',
          bcp47Locale: 'en-US',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.language.findMany).mockResolvedValue(mockLanguages)

      const result = await isLanguageEnabled('en')

      expect(result).toBe(true)
    })

    it('should return false for disabled language', async () => {
      const mockLanguages = [
        {
          code: 'en',
          name: 'English',
          nativeName: 'English',
          direction: 'ltr',
          flag: '🇺🇸',
          bcp47Locale: 'en-US',
          enabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.language.findMany).mockResolvedValue(mockLanguages)

      const result = await isLanguageEnabled('en')

      expect(result).toBe(false)
    })
  })

  describe('getEnabledLanguageCodes', () => {
    it('should return array of enabled language codes', async () => {
      const mockLanguages = [
        {
          code: 'en',
          name: 'English',
          nativeName: 'English',
          direction: 'ltr',
          flag: '🇺🇸',
          bcp47Locale: 'en-US',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          code: 'ar',
          name: 'Arabic',
          nativeName: 'العربية',
          direction: 'rtl',
          flag: '🇸🇦',
          bcp47Locale: 'ar-SA',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          code: 'fr',
          name: 'French',
          nativeName: 'Français',
          direction: 'ltr',
          flag: '🇫🇷',
          bcp47Locale: 'fr-FR',
          enabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(prisma.language.findMany).mockResolvedValue(mockLanguages)

      const result = await getEnabledLanguageCodes()

      expect(result).toEqual(['en', 'ar'])
    })
  })

  describe('toggleLanguageStatus', () => {
    it('should toggle language enabled status', async () => {
      const mockLanguage = {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        direction: 'rtl',
        flag: '🇸🇦',
        bcp47Locale: 'ar-SA',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.language.findMany).mockResolvedValue([mockLanguage])
      vi.mocked(prisma.language.update).mockResolvedValue({
        ...mockLanguage,
        enabled: false,
      })

      const result = await toggleLanguageStatus('ar')

      expect(result.enabled).toBe(false)
      expect(prisma.language.update).toHaveBeenCalledWith({
        where: { code: 'ar' },
        data: { enabled: false },
      })
    })

    it('should prevent toggling default language', async () => {
      vi.mocked(prisma.language.findMany).mockResolvedValue([])

      await expect(toggleLanguageStatus('en')).rejects.toThrow('Cannot disable default language')
    })
  })
})

/**
 * Language Registry Service
 * Manages language configuration from database with caching and fallback support
 * Replaces hardcoded language lists in favor of data-driven approach
 */

import prisma from '@/lib/prisma'

export interface LanguageConfig {
  code: string
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  flag?: string
  bcp47Locale: string
  enabled: boolean
}

interface LocaleConfigMap {
  [code: string]: {
    name: string
    nativeName: string
    dir: 'ltr' | 'rtl'
    flag: string
  }
}

interface BCP47LocaleMap {
  [code: string]: string
}

/**
 * Fallback language configuration when database is unavailable
 */
const FALLBACK_LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    flag: '🇺🇸',
    bcp47Locale: 'en-US',
    enabled: true,
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    flag: '🇸🇦',
    bcp47Locale: 'ar-SA',
    enabled: true,
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    direction: 'ltr',
    flag: '🇮🇳',
    bcp47Locale: 'hi-IN',
    enabled: true,
  },
]

/**
 * In-memory cache for language configuration
 * TTL: 1 hour (3600 seconds)
 */
let languageCache: LanguageConfig[] | null = null
let languageCacheExpiry: number | null = null
const CACHE_TTL = 3600000 // 1 hour in milliseconds

/**
 * Get all languages from database or cache
 * Falls back to hardcoded config if database is unavailable
 */
export async function getAllLanguages(): Promise<LanguageConfig[]> {
  try {
    // Check if cache is still valid
    const now = Date.now()
    if (languageCache && languageCacheExpiry && now < languageCacheExpiry) {
      return languageCache
    }

    // Fetch from database
    const languages = await prisma.language.findMany()
    const config = languages.map((lang) => ({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      direction: (lang.direction as 'ltr' | 'rtl') || 'ltr',
      flag: lang.flag || undefined,
      bcp47Locale: lang.bcp47Locale,
      enabled: lang.enabled,
    }))

    // Update cache
    languageCache = config
    languageCacheExpiry = now + CACHE_TTL

    return config
  } catch (error) {
    console.warn('Failed to load languages from database, using fallback', {
      error: error instanceof Error ? error.message : String(error),
    })
    return FALLBACK_LANGUAGES
  }
}

/**
 * Get only enabled languages
 */
export async function getEnabledLanguages(): Promise<LanguageConfig[]> {
  const all = await getAllLanguages()
  return all.filter((lang) => lang.enabled)
}

/**
 * Get language by code
 */
export async function getLanguageByCode(code: string): Promise<LanguageConfig | null> {
  const all = await getAllLanguages()
  return all.find((lang) => lang.code === code) || null
}

/**
 * Check if language code is supported and enabled
 */
export async function isLanguageEnabled(code: string): Promise<boolean> {
  const lang = await getLanguageByCode(code)
  return !!lang && lang.enabled
}

/**
 * Get language codes for enabled languages
 */
export async function getEnabledLanguageCodes(): Promise<string[]> {
  const enabled = await getEnabledLanguages()
  return enabled.map((lang) => lang.code)
}

/**
 * Get locale config object for use in i18n utilities
 * Used to replace hardcoded localeConfig in src/lib/i18n.ts
 */
export async function getLocaleConfig(): Promise<LocaleConfigMap> {
  const all = await getAllLanguages()
  const config: LocaleConfigMap = {}
  for (const lang of all) {
    config[lang.code] = {
      name: lang.name,
      nativeName: lang.nativeName,
      dir: lang.direction,
      flag: lang.flag || '🌐',
    }
  }
  return config
}

/**
 * Get BCP47 locale mapping for Intl API formatting
 * Used to replace hardcoded map in src/lib/locale.ts
 */
export async function getBCP47LocaleMap(): Promise<BCP47LocaleMap> {
  const all = await getAllLanguages()
  const map: BCP47LocaleMap = {}
  for (const lang of all) {
    map[lang.code] = lang.bcp47Locale
  }
  return map
}

/**
 * Get all locales (language codes) ordered by enabled status
 * Used for useTranslations hook in src/lib/i18n.ts
 */
export async function getAllLocales(): Promise<string[]> {
  const all = await getAllLanguages()
  // Enabled languages first, then disabled
  return all.sort((a, b) => (b.enabled ? 1 : -1) - (a.enabled ? 1 : -1)).map((lang) => lang.code)
}

/**
 * Validate language code against enabled languages
 * Useful for Zod schema validation
 */
export async function validateLanguageCode(code: string): Promise<boolean> {
  const enabled = await getEnabledLanguageCodes()
  return enabled.includes(code)
}

/**
 * Create or update a language
 * Requires proper permissions to call
 */
export async function upsertLanguage(code: string, data: Partial<LanguageConfig>): Promise<LanguageConfig> {
  try {
    const lang = await prisma.language.upsert({
      where: { code },
      create: {
        code,
        name: data.name || 'Unknown',
        nativeName: data.nativeName || 'Unknown',
        direction: data.direction || 'ltr',
        flag: data.flag,
        bcp47Locale: data.bcp47Locale || 'en-US',
        enabled: data.enabled !== false,
      },
      update: {
        ...(data.name && { name: data.name }),
        ...(data.nativeName && { nativeName: data.nativeName }),
        ...(data.direction && { direction: data.direction }),
        ...(data.flag && { flag: data.flag }),
        ...(data.bcp47Locale && { bcp47Locale: data.bcp47Locale }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
      },
    })

    // Invalidate cache
    languageCache = null
    languageCacheExpiry = null

    return {
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      direction: (lang.direction as 'ltr' | 'rtl') || 'ltr',
      flag: lang.flag || undefined,
      bcp47Locale: lang.bcp47Locale,
      enabled: lang.enabled,
    }
  } catch (error) {
    console.error('Failed to upsert language', { code, error })
    throw error
  }
}

/**
 * Delete a language
 * Prevents deletion if users have this language set (requires migration first)
 * Requires proper permissions to call
 */
export async function deleteLanguage(code: string): Promise<void> {
  try {
    // Prevent deletion of default language
    if (code === 'en') {
      throw new Error('Cannot delete default language (en)')
    }

    // Check if any users have this language set
    const usersWithLanguage = await prisma.userProfile.count({
      where: { preferredLanguage: code },
    })

    if (usersWithLanguage > 0) {
      throw new Error(
        `Cannot delete language ${code}: ${usersWithLanguage} users have this language set. Migrate users first.`
      )
    }

    await prisma.language.delete({ where: { code } })

    // Invalidate cache
    languageCache = null
    languageCacheExpiry = null
  } catch (error) {
    console.error('Failed to delete language', { code, error })
    throw error
  }
}

/**
 * Toggle language enabled/disabled status
 * Requires proper permissions to call
 */
export async function toggleLanguageStatus(code: string): Promise<LanguageConfig> {
  try {
    // Prevent disabling default language
    if (code === 'en') {
      throw new Error('Cannot disable default language (en)')
    }

    const current = await getLanguageByCode(code)
    if (!current) {
      throw new Error(`Language ${code} not found`)
    }

    const updated = await prisma.language.update({
      where: { code },
      data: { enabled: !current.enabled },
    })

    // Invalidate cache
    languageCache = null
    languageCacheExpiry = null

    return {
      code: updated.code,
      name: updated.name,
      nativeName: updated.nativeName,
      direction: (updated.direction as 'ltr' | 'rtl') || 'ltr',
      flag: updated.flag || undefined,
      bcp47Locale: updated.bcp47Locale,
      enabled: updated.enabled,
    }
  } catch (error) {
    console.error('Failed to toggle language status', { code, error })
    throw error
  }
}

/**
 * Clear language cache
 * Useful after batch operations or testing
 */
export function clearLanguageCache(): void {
  languageCache = null
  languageCacheExpiry = null
}

import prisma from '@/lib/prisma'
import type { Locale } from '@/lib/i18n'
import { locales } from '@/lib/i18n'

/**
 * Fetch the authenticated user's preferred language from the database
 * Falls back to the organization default if user not found or no preference set
 *
 * @param userEmail - User's email address
 * @param tenantId - User's tenant ID
 * @param fallbackLocale - Default locale to use if user preference not found
 * @returns User's preferred locale or fallback
 */
export async function getUserPreferredLocale(
  userEmail: string | null | undefined,
  tenantId: string | null | undefined,
  fallbackLocale: Locale = 'en'
): Promise<Locale> {
  if (!userEmail || !tenantId) {
    return fallbackLocale
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: userEmail, tenantId },
      include: { userProfile: true },
    })

    if (!user?.userProfile?.preferredLanguage) {
      return fallbackLocale
    }

    const preferredLang = user.userProfile.preferredLanguage
    // Validate it's a supported locale
    if (locales.includes(preferredLang as Locale)) {
      return preferredLang as Locale
    }

    return fallbackLocale
  } catch (error) {
    // If DB query fails, silently fall back to organization default
    console.error('Failed to fetch user preferred locale:', error)
    return fallbackLocale
  }
}

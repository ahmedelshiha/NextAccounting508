import { getServerTranslations } from './translations'
import { createServerTranslator } from './server-translator'
import type { Locale } from '@/lib/i18n'

/**
 * Server-side helper to load translations and provide a translator for server components.
 * Usage (server component):
 * const { translations, t } = await useServerTranslations('hi')
 * const headline = t('hero.headline')
 */
export async function useServerTranslations(locale: Locale = 'en', currentGender?: string) {
  const translations = await getServerTranslations(locale)
  const { t } = createServerTranslator(locale, translations as any, currentGender)
  return { translations, t }
}

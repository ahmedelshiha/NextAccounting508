import type { Locale } from '@/lib/i18n'
import { buildGenderKey } from '@/lib/gender-rules'
import { getPluralForm } from '@/lib/i18n-plural'

export type Translations = Record<string, string>

export function createServerTranslator(
  locale: Locale,
  translations: Translations,
  currentGender?: string | undefined
) {
  const t = (key: string, params?: Record<string, any>) => {
    const gender = params?.gender ?? currentGender
    const count = typeof params?.count === 'number' ? params.count : undefined

    const fallbacks: string[] = []

    if (typeof count === 'number') {
      const pluralForm = getPluralForm(locale, count)
      if (gender) {
        fallbacks.push(`${key}.${pluralForm}.${gender}`)
      }
      fallbacks.push(`${key}.${pluralForm}`)
    }

    if (gender) {
      const genderKey = buildGenderKey(key, gender as any, locale)
      if (genderKey !== key) fallbacks.push(genderKey)
    }

    fallbacks.push(key)

    const keyFallbacks = Array.from(new Set(fallbacks))

    let translation: string = key
    for (const fk of keyFallbacks) {
      if (fk in translations) {
        translation = translations[fk]
        break
      }
    }

    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        if (param === 'gender' || param === 'count' || value === undefined) return
        translation = translation.replace(`{{${param}}}`, String(value))
      })
    }

    return translation
  }

  return { t }
}

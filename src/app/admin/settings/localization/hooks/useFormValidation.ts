import type { LanguageRow } from '../types'

export function useFormValidation() {
  function validateLanguage(language: LanguageRow) {
    const errors: Record<string, string> = {}

    if (!language.code || !language.code.trim()) {
      errors.code = 'Language code is required'
    } else if (!/^[a-z]{2,3}(-[a-z]{2})?$/i.test(language.code)) {
      errors.code = 'Invalid language code format (e.g., "en" or "en-US")'
    }

    if (!language.name || !language.name.trim()) {
      errors.name = 'English name is required'
    }

    if (!language.nativeName || !language.nativeName.trim()) {
      errors.nativeName = 'Native name is required'
    }

    if (!language.bcp47Locale || !language.bcp47Locale.trim()) {
      errors.bcp47Locale = 'BCP47 locale is required'
    } else if (!/^[a-z]{2,3}(-[a-z]{2})?$/i.test(language.bcp47Locale)) {
      errors.bcp47Locale = 'Invalid BCP47 locale format (e.g., "en-US")'
    }

    return errors
  }

  function validateOrgSettings(orgSettings: any, languages: any[]) {
    const errors: { general?: string } = {}
    const defaultLang = languages.find((l: any) => l.code === orgSettings.defaultLanguage)
    const fallbackLang = languages.find((l: any) => l.code === orgSettings.fallbackLanguage)

    if (!defaultLang || !defaultLang.enabled) {
      errors.general = 'Default language must be an enabled language'
    }

    if (!fallbackLang || !fallbackLang.enabled) {
      errors.general = errors.general ? errors.general + ' | Fallback language must be an enabled language' : 'Fallback language must be an enabled language'
    }

    return errors
  }

  function validateFormat(format: any) {
    const newErrors: Record<string, string> = {}

    if (!format) {
      newErrors.dateFormat = 'Format missing'
      return newErrors
    }

    if (!String(format.dateFormat || '').trim()) {
      newErrors.dateFormat = 'Date format is required'
    }
    if (!String(format.timeFormat || '').trim()) {
      newErrors.timeFormat = 'Time format is required'
    }
    if (!String(format.currencyCode || '').trim()) {
      newErrors.currencyCode = 'Currency code is required'
    } else if (String(format.currencyCode).length !== 3) {
      newErrors.currencyCode = 'Currency code must be 3 letters (ISO 4217)'
    }
    if (!String(format.currencySymbol || '').trim()) {
      newErrors.currencySymbol = 'Currency symbol is required'
    }
    if (!String(format.numberFormat || '').trim()) {
      newErrors.numberFormat = 'Number format is required'
    }

    return newErrors
  }

  return {
    validateLanguage,
    validateOrgSettings,
    validateFormat,
  }
}

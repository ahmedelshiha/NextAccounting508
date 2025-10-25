import * as countries from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json'

// Register English locale names
countries.registerLocale(enLocale as any)

export function lookupCountryISO(name: string): string | null {
  if (!name) return null
  const raw = String(name).trim()
  const lower = raw.toLowerCase()

  // If already two-letter code
  if (/^[a-z]{2}$/.test(lower)) return lower

  // Try direct lookup using library (handles many aliases)
  let code = countries.getAlpha2Code(raw, 'en')
  if (code) return code.toLowerCase()

  // Try cleaned name (remove punctuation)
  const cleaned = raw.replace(/[^a-zA-Z\s]/g, ' ').replace(/\s+/g, ' ').trim()
  code = countries.getAlpha2Code(cleaned, 'en')
  if (code) return code.toLowerCase()

  // Try last word (e.g., "Republic of Korea" -> "Korea")
  const last = cleaned.split(' ').slice(-1)[0]
  if (last) {
    code = countries.getAlpha2Code(last, 'en')
    if (code) return code.toLowerCase()
  }

  // Common short aliases
  const aliases: Record<string, string> = {
    usa: 'us',
    uk: 'gb',
    'u.s.a.': 'us',
    'u.k.': 'gb',
    scotland: 'gb',
    england: 'gb',
    'south korea': 'kr',
    'north korea': 'kp',
  }
  const a = lower.replace(/[^a-z\s]/g, '').trim()
  if (aliases[a]) return aliases[a]

  return null
}

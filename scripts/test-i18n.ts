import { locales, defaultLocale } from '../src/lib/i18n'
import fs from 'fs'
import path from 'path'

async function loadTranslationsFs(locale: string): Promise<Record<string, string>> {
  const filePath = path.resolve(__dirname, '..', 'src', 'app', 'locales', `${locale}.json`)
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    console.warn(`Failed to load translations for locale ${locale} from ${filePath}:`, (err as Error).message)
    return {}
  }
}

async function run() {
  let exitCode = 0

  console.log('Locales declared in code:', locales.join(', '))

  // Ensure locale config for Arabic is RTL by reading lib file
  try {
    const i18nModule = await import('../src/lib/i18n')
    if (i18nModule.localeConfig?.ar?.dir !== 'rtl') {
      console.error('ERROR: localeConfig.ar.dir is not set to "rtl"')
      exitCode = 2
    } else {
      console.log('OK: localeConfig.ar.dir is rtl')
    }
  } catch (err) {
    console.warn('Could not import src/lib/i18n to validate config:', (err as Error).message)
  }

  // Load translations for each locale using filesystem (path independent)
  const translationsMap: Record<string, string[]> = {}

  for (const loc of locales) {
    const t = await loadTranslationsFs(loc)
    const keys = Object.keys(t)
    translationsMap[loc] = keys
    console.log(`Loaded translations for ${loc}: ${keys.length} keys`)
    if (keys.length === 0) {
      console.warn(`WARNING: No translations found for locale: ${loc}`)
      exitCode = 3
    }
  }

  // Check key parity against default locale
  const defaultKeys = translationsMap[defaultLocale] || []

  for (const loc of locales) {
    if (loc === defaultLocale) continue
    const keys = translationsMap[loc] || []
    const missing = defaultKeys.filter(k => !keys.includes(k))
    if (missing.length > 0) {
      console.error(`Locale ${loc} is missing ${missing.length} keys compared to ${defaultLocale}. Example: ${missing.slice(0,5).join(', ')}`)
      exitCode = 5
    } else {
      console.log(`OK: Locale ${loc} has parity with ${defaultLocale}`)
    }
  }

  if (exitCode === 0) {
    console.log('\nAll i18n checks passed.')
  } else {
    console.error('\nOne or more i18n checks failed. See errors above.')
  }

  process.exit(exitCode)
}

run().catch(err => {
  console.error('Fatal error running i18n tests:', err)
  process.exit(1)
})

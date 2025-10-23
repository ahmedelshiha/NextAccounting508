import fs from 'fs'
import path from 'path'

import { locales, defaultLocale } from '../src/lib/i18n'
import { flattenTranslations, validateNestedStructure, validateTranslationParity } from '../src/lib/translation-utils'
import { genderVariants } from '../src/lib/gender-rules'

function loadTranslationsFs(locale: string): any {
  const filePath = path.resolve(__dirname, '..', 'src', 'app', 'locales', `${locale}.json`)
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    console.warn(`Failed to load translations for locale ${locale} from ${filePath}:`, (err as Error).message)
    return {}
  }
}

function extractStructure(obj: any, prefix = ''): { objects: Set<string>; leaves: Set<string> } {
  const objects = new Set<string>()
  const leaves = new Set<string>()

  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    objects.add(prefix || 'root')
    for (const key of Object.keys(obj)) {
      const value = obj[key]
      const next = prefix ? `${prefix}.${key}` : key
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const child = extractStructure(value, next)
        child.objects.forEach((o) => objects.add(o))
        child.leaves.forEach((l) => leaves.add(l))
      } else if (typeof value === 'string') {
        leaves.add(next)
      }
    }
  }

  return { objects, leaves }
}

async function run() {
  let exitCode = 0

  console.log('Locales declared in code:', locales.join(', '))

  // Validate basic config (RTL for ar)
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

  // Load, validate nested structure, and flatten
  const flatLocales: Record<string, Record<string, string>> = {}
  const structures: Record<string, { objects: Set<string>; leaves: Set<string> }> = {}

  for (const loc of locales) {
    const nested = loadTranslationsFs(loc)

    const structureErrors = validateNestedStructure(nested)
    if (structureErrors.length) {
      console.error(`ERROR: Invalid nested structure in ${loc}.json:`)
      structureErrors.slice(0, 10).forEach((e) => console.error(' -', e))
      if (structureErrors.length > 10) console.error(` ...and ${structureErrors.length - 10} more`)
      exitCode = 4
    }

    const flat = flattenTranslations(nested)
    flatLocales[loc] = flat
    structures[loc] = extractStructure(nested)

    console.log(`Loaded translations for ${loc}: ${Object.keys(flat).length} flat keys`)
    if (Object.keys(flat).length === 0) {
      console.warn(`WARNING: No translations found for locale: ${loc}`)
      exitCode = 3
    }
  }

  // Validate translation parity (ignoring locale-specific gender variants)
  const supportedGenders: Record<string, string[]> = {}
  for (const loc of locales) supportedGenders[loc] = (genderVariants as any)[loc] || []
  const parityErrors = validateTranslationParity(flatLocales, supportedGenders)
  if (parityErrors.length) {
    console.error('ERROR: Translation key parity validation failed:')
    parityErrors.slice(0, 20).forEach((e) => console.error(' -', e))
    if (parityErrors.length > 20) console.error(` ...and ${parityErrors.length - 20} more`)
    exitCode = 5
  } else {
    console.log('OK: All locales have parity with reference locale (ignoring gender variants)')
  }

  // Validate namespace/shape parity across locales (object vs leaf at same path)
  const ref = structures[defaultLocale]
  for (const loc of locales) {
    if (loc === defaultLocale) continue

    const cur = structures[loc]
    // Any path that is an object in reference must not be a leaf in the current locale, and vice versa
    for (const objPath of ref.objects) {
      if (cur.leaves.has(objPath)) {
        console.error(`ERROR: Namespace shape mismatch: in ${defaultLocale} "${objPath}" is an object but in ${loc} it is a leaf`)
        exitCode = 6
      }
    }
    for (const leafPath of ref.leaves) {
      if (cur.objects.has(leafPath)) {
        console.error(`ERROR: Namespace shape mismatch: in ${defaultLocale} "${leafPath}" is a leaf but in ${loc} it is an object`)
        exitCode = 6
      }
    }
  }
  if (exitCode !== 6) {
    console.log('OK: Namespace/shape parity validated across locales')
  }

  if (exitCode === 0) {
    console.log('\nAll i18n checks passed.')
  } else {
    console.error('\nOne or more i18n checks failed. See errors above.')
  }

  process.exit(exitCode)
}

run().catch((err) => {
  console.error('Fatal error running i18n tests:', err)
  process.exit(1)
})

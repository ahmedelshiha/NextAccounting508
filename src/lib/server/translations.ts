import fs from 'fs'
import path from 'path'
import { flattenTranslations, validateNestedStructure } from '@/lib/translation-utils'

export async function getServerTranslations(locale: string): Promise<Record<string, string>> {
  try {
    const filePath = path.resolve(process.cwd(), 'src', 'app', 'locales', `${locale}.json`)
    if (!fs.existsSync(filePath)) return {}
    const raw = await fs.promises.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw)

    // Validate structure server-side (throws if invalid)
    const structureErrors = validateNestedStructure(parsed)
    if (structureErrors.length) {
      console.warn(`Invalid nested translation structure for locale ${locale}:`, structureErrors.slice(0, 5))
      // continue — attempt to flatten anyway
    }

    const flat = flattenTranslations(parsed)
    return flat
  } catch (err) {
    console.warn('getServerTranslations error for', locale, err)
    return {}
  }
}

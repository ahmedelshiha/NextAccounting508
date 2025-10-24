import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const POST = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const languages = body.languages || []

    if (!Array.isArray(languages) || languages.length === 0) {
      return Response.json({ error: 'Invalid languages array' }, { status: 400 })
    }

    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const lang of languages) {
      try {
        const { code, name, nativeName, direction, flag, bcp47Locale, enabled = true } = lang

        if (!code || !name || !nativeName || !bcp47Locale) {
          results.skipped++
          results.errors.push(`${code || 'unknown'}: Missing required fields`)
          continue
        }

        const existing = await prisma.language.findUnique({
          where: { code: code.toLowerCase() },
        })

        if (existing) {
          await prisma.language.update({
            where: { code: code.toLowerCase() },
            data: {
              name,
              nativeName,
              direction: direction || 'ltr',
              flag: flag || existing.flag,
              bcp47Locale,
              enabled,
            },
          })
          results.updated++
        } else {
          await prisma.language.create({
            data: {
              code: code.toLowerCase(),
              name,
              nativeName,
              direction: direction || 'ltr',
              flag: flag || '🌐',
              bcp47Locale,
              enabled,
            },
          })
          results.imported++
        }
      } catch (err: any) {
        results.skipped++
        results.errors.push(`${lang.code}: ${err.message}`)
      }
    }

    return Response.json({
      success: true,
      data: results,
    })
  } catch (error: any) {
    console.error('Failed to import languages:', error)
    return Response.json({ error: error.message || 'Failed to import languages' }, { status: 500 })
  }
})

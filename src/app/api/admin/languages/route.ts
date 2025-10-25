import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const languages = await prisma.language.findMany({
      orderBy: { code: 'asc' },
    })

    return Response.json({
      success: true,
      data: languages.map(lang => ({
        code: lang.code,
        name: lang.name,
        nativeName: lang.nativeName,
        direction: lang.direction,
        flag: lang.flag,
        bcp47Locale: lang.bcp47Locale,
        enabled: lang.enabled,
      })),
    })
  } catch (error: any) {
    console.error('Failed to get languages:', error)
    return Response.json({ error: error.message || 'Failed to get languages' }, { status: 500 })
  }
})

export const POST = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { code, name, nativeName, direction, flag, bcp47Locale, enabled = true } = body

    if (!code || !name || !nativeName || !bcp47Locale) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existing = await prisma.language.findUnique({
      where: { code: code.toLowerCase() },
    })

    if (existing) {
      return Response.json({ error: 'Language code already exists' }, { status: 400 })
    }

    const language = await prisma.language.create({
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

    return Response.json({
      success: true,
      data: language,
    })
  } catch (error: any) {
    console.error('Failed to create language:', error)
    return Response.json({ error: error.message || 'Failed to create language' }, { status: 500 })
  }
})

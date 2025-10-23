import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { tenantFilter } from '@/lib/tenant'
import type { Language } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission((session.user as any)?.role, PERMISSIONS.LANGUAGES_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = tenantFilter()
    const languages = await prisma.language.findMany({
      where: { tenantId },
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
        featured: lang.featured,
      })),
    })
  } catch (error: any) {
    console.error('Failed to get languages:', error)
    return Response.json({ error: error.message || 'Failed to get languages' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission((session.user as any)?.role, PERMISSIONS.LANGUAGES_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { code, name, nativeName, direction, flag, bcp47Locale, enabled = true, featured = false } = body

    if (!code || !name || !nativeName || !bcp47Locale) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const tenantId = tenantFilter()

    const existing = await prisma.language.findUnique({
      where: { tenantId_code: { tenantId, code: code.toLowerCase() } },
    })

    if (existing) {
      return Response.json({ error: 'Language code already exists' }, { status: 400 })
    }

    const language = await prisma.language.create({
      data: {
        tenantId,
        code: code.toLowerCase(),
        name,
        nativeName,
        direction: direction || 'ltr',
        flag: flag || '🌐',
        bcp47Locale,
        enabled,
        featured,
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
}

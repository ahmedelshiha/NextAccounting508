import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { tenantFilter } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission((session.user as any)?.role, PERMISSIONS.ORG_SETTINGS_VIEW)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = tenantFilter()

    const settings = await prisma.organizationLocalizationSettings.findUnique({
      where: { tenantId },
    })

    if (!settings) {
      return Response.json({
        success: true,
        data: {
          defaultLanguage: 'en',
          fallbackLanguage: 'en',
          showLanguageSwitcher: true,
          persistLanguagePreference: true,
          autoDetectBrowserLanguage: true,
          allowUserLanguageOverride: true,
          enableRtlSupport: true,
          missingTranslationBehavior: 'show-fallback',
        },
      })
    }

    return Response.json({ success: true, data: settings })
  } catch (error: any) {
    console.error('Failed to get localization settings:', error)
    return Response.json({ error: error.message || 'Failed to get localization settings' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission((session.user as any)?.role, PERMISSIONS.ORG_SETTINGS_MANAGE)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = tenantFilter()
    const body = await req.json()

    const settings = await prisma.organizationLocalizationSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        defaultLanguage: body.defaultLanguage || 'en',
        fallbackLanguage: body.fallbackLanguage || 'en',
        showLanguageSwitcher: body.showLanguageSwitcher ?? true,
        persistLanguagePreference: body.persistLanguagePreference ?? true,
        autoDetectBrowserLanguage: body.autoDetectBrowserLanguage ?? true,
        allowUserLanguageOverride: body.allowUserLanguageOverride ?? true,
        enableRtlSupport: body.enableRtlSupport ?? true,
        missingTranslationBehavior: body.missingTranslationBehavior || 'show-fallback',
      },
      update: {
        defaultLanguage: body.defaultLanguage || undefined,
        fallbackLanguage: body.fallbackLanguage || undefined,
        showLanguageSwitcher: body.showLanguageSwitcher !== undefined ? body.showLanguageSwitcher : undefined,
        persistLanguagePreference: body.persistLanguagePreference !== undefined ? body.persistLanguagePreference : undefined,
        autoDetectBrowserLanguage: body.autoDetectBrowserLanguage !== undefined ? body.autoDetectBrowserLanguage : undefined,
        allowUserLanguageOverride: body.allowUserLanguageOverride !== undefined ? body.allowUserLanguageOverride : undefined,
        enableRtlSupport: body.enableRtlSupport !== undefined ? body.enableRtlSupport : undefined,
        missingTranslationBehavior: body.missingTranslationBehavior || undefined,
      },
    })

    return Response.json({ success: true, data: settings })
  } catch (error: any) {
    console.error('Failed to save localization settings:', error)
    return Response.json({ error: error.message || 'Failed to save localization settings' }, { status: 500 })
  }
}

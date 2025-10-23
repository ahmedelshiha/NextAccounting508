import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import * as Sentry from '@sentry/nextjs'

interface LocalizationSettings {
  defaultLanguage: string
  fallbackLanguage: string
  showLanguageSwitcher: boolean
  persistLanguagePreference: boolean
  autoDetectBrowserLanguage: boolean
  allowUserLanguageOverride: boolean
  enableRtlSupport: boolean
  missingTranslationBehavior: 'show-key' | 'show-fallback' | 'show-empty'
}

const DEFAULT_SETTINGS: LocalizationSettings = {
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
  showLanguageSwitcher: true,
  persistLanguagePreference: true,
  autoDetectBrowserLanguage: true,
  allowUserLanguageOverride: true,
  enableRtlSupport: true,
  missingTranslationBehavior: 'show-fallback',
}

/**
 * GET /api/admin/org-settings/localization
 * Fetch organization-wide localization settings
 */
export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    const tenantId = ctx.tenantId

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant context missing' },
        { status: 400 }
      )
    }

    let settings = await prisma.organizationLocalizationSettings.findUnique({
      where: { tenantId },
    })

    if (!settings) {
      settings = await prisma.organizationLocalizationSettings.create({
        data: {
          tenantId,
          ...DEFAULT_SETTINGS,
        },
      })
    }

    const response: LocalizationSettings = {
      defaultLanguage: settings.defaultLanguage,
      fallbackLanguage: settings.fallbackLanguage,
      showLanguageSwitcher: settings.showLanguageSwitcher,
      persistLanguagePreference: settings.persistLanguagePreference,
      autoDetectBrowserLanguage: settings.autoDetectBrowserLanguage,
      allowUserLanguageOverride: settings.allowUserLanguageOverride,
      enableRtlSupport: settings.enableRtlSupport,
      missingTranslationBehavior: settings.missingTranslationBehavior as 'show-key' | 'show-fallback' | 'show-empty',
    }

    return NextResponse.json({ data: response })
  } catch (error) {
    console.error('Failed to fetch localization settings:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to fetch localization settings' },
      { status: 500 }
    )
  }
})

/**
 * PUT /api/admin/org-settings/localization
 * Update organization-wide localization settings
 */
export const PUT = withTenantContext(async (request: NextRequest, context: any) => {
  try {
    const tenantId = context.tenantId
    const body = await request.json()

    if (!body.defaultLanguage || !body.fallbackLanguage) {
      return NextResponse.json(
        { error: 'defaultLanguage and fallbackLanguage are required' },
        { status: 400 }
      )
    }

    const settings = await prisma.organizationLocalizationSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        defaultLanguage: body.defaultLanguage,
        fallbackLanguage: body.fallbackLanguage,
        showLanguageSwitcher: body.showLanguageSwitcher ?? true,
        persistLanguagePreference: body.persistLanguagePreference ?? true,
        autoDetectBrowserLanguage: body.autoDetectBrowserLanguage ?? true,
        allowUserLanguageOverride: body.allowUserLanguageOverride ?? true,
        enableRtlSupport: body.enableRtlSupport ?? true,
        missingTranslationBehavior: body.missingTranslationBehavior ?? 'show-fallback',
      },
      update: {
        defaultLanguage: body.defaultLanguage,
        fallbackLanguage: body.fallbackLanguage,
        showLanguageSwitcher: body.showLanguageSwitcher ?? true,
        persistLanguagePreference: body.persistLanguagePreference ?? true,
        autoDetectBrowserLanguage: body.autoDetectBrowserLanguage ?? true,
        allowUserLanguageOverride: body.allowUserLanguageOverride ?? true,
        enableRtlSupport: body.enableRtlSupport ?? true,
        missingTranslationBehavior: body.missingTranslationBehavior ?? 'show-fallback',
      },
    })

    Sentry.addBreadcrumb({
      category: 'localization.settings',
      message: 'Organization localization settings updated',
      level: 'info',
      data: {
        defaultLanguage: settings.defaultLanguage,
        fallbackLanguage: settings.fallbackLanguage,
      },
    })

    const response: LocalizationSettings = {
      defaultLanguage: settings.defaultLanguage,
      fallbackLanguage: settings.fallbackLanguage,
      showLanguageSwitcher: settings.showLanguageSwitcher,
      persistLanguagePreference: settings.persistLanguagePreference,
      autoDetectBrowserLanguage: settings.autoDetectBrowserLanguage,
      allowUserLanguageOverride: settings.allowUserLanguageOverride,
      enableRtlSupport: settings.enableRtlSupport,
      missingTranslationBehavior: settings.missingTranslationBehavior as 'show-key' | 'show-fallback' | 'show-empty',
    }

    return NextResponse.json({ data: response })
  } catch (error) {
    console.error('Failed to update localization settings:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to update localization settings' },
      { status: 500 }
    )
  }
})

import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
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

/**
 * GET /api/admin/org-settings/localization
 * Fetch organization-wide localization settings
 */
export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    // TODO: Fetch from database when org_settings table is created
    // For now, return sensible defaults
    const settings: LocalizationSettings = {
      defaultLanguage: 'en',
      fallbackLanguage: 'en',
      showLanguageSwitcher: true,
      persistLanguagePreference: true,
      autoDetectBrowserLanguage: true,
      allowUserLanguageOverride: true,
      enableRtlSupport: true,
      missingTranslationBehavior: 'show-fallback',
    }

    return NextResponse.json({ data: settings })
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
export const PUT = withTenantContext(async (request: NextRequest) => {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.defaultLanguage || !body.fallbackLanguage) {
      return NextResponse.json(
        { error: 'defaultLanguage and fallbackLanguage are required' },
        { status: 400 }
      )
    }

    // TODO: Save to database when org_settings table is created
    // For now, just validate and return

    const settings: LocalizationSettings = {
      defaultLanguage: body.defaultLanguage,
      fallbackLanguage: body.fallbackLanguage,
      showLanguageSwitcher: body.showLanguageSwitcher ?? true,
      persistLanguagePreference: body.persistLanguagePreference ?? true,
      autoDetectBrowserLanguage: body.autoDetectBrowserLanguage ?? true,
      allowUserLanguageOverride: body.allowUserLanguageOverride ?? true,
      enableRtlSupport: body.enableRtlSupport ?? true,
      missingTranslationBehavior: body.missingTranslationBehavior ?? 'show-fallback',
    }

    Sentry.addBreadcrumb({
      category: 'localization.settings',
      message: 'Organization localization settings updated',
      level: 'info',
      data: {
        defaultLanguage: settings.defaultLanguage,
        fallbackLanguage: settings.fallbackLanguage,
      },
    })

    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('Failed to update localization settings:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to update localization settings' },
      { status: 500 }
    )
  }
})

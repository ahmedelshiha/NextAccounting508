import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import * as Sentry from '@sentry/nextjs'

interface LanguageDistribution {
  language: string
  count: number
  percentage: number
}

interface AnalyticsResponse {
  totalUsers: number
  languagesInUse: string[]
  distribution: LanguageDistribution[]
  mostUsedLanguage: string | null
  timestamp: string
}

/**
 * GET /api/admin/user-language-analytics
 * Fetch user language distribution analytics
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

    // Get all users for this tenant with their language preferences
    const users = await prisma.userProfile.findMany({
      where: {
        user: {
          tenantId,
        },
      },
      select: {
        preferredLanguage: true,
      },
    })

    // Also get users without profiles (use default)
    const usersWithoutProfiles = await prisma.user.findMany({
      where: {
        tenantId,
        userProfile: null,
      },
      select: {
        id: true,
      },
    })

    // Calculate distribution
    const languageCount: Record<string, number> = {}
    let defaultLanguageCount = usersWithoutProfiles.length

    for (const profile of users) {
      const lang = profile.preferredLanguage || 'en'
      languageCount[lang] = (languageCount[lang] || 0) + 1
    }

    // Add default language count
    if (defaultLanguageCount > 0) {
      languageCount['en'] = (languageCount['en'] || 0) + defaultLanguageCount
    }

    const totalUsers = users.length + usersWithoutProfiles.length
    const languagesInUse = Object.keys(languageCount).sort()

    const distribution: LanguageDistribution[] = languagesInUse.map((lang) => ({
      language: lang,
      count: languageCount[lang],
      percentage: totalUsers > 0 ? Math.round((languageCount[lang] / totalUsers) * 100 * 100) / 100 : 0,
    }))

    distribution.sort((a, b) => b.count - a.count)

    const mostUsedLanguage = distribution.length > 0 ? distribution[0].language : null

    const response: AnalyticsResponse = {
      totalUsers,
      languagesInUse,
      distribution,
      mostUsedLanguage,
      timestamp: new Date().toISOString(),
    }

    Sentry.addBreadcrumb({
      category: 'analytics.language',
      message: 'User language distribution queried',
      level: 'info',
      data: {
        totalUsers,
        languageCount: languagesInUse.length,
      },
    })

    return NextResponse.json({ data: response })
  } catch (error) {
    console.error('Failed to fetch user language analytics:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to fetch user language analytics' },
      { status: 500 }
    )
  }
})

/**
 * GET /api/admin/user-language-analytics/trends
 * Fetch language adoption trends over time
 */
export async function GET_TRENDS(request: NextRequest, context: any) {
  try {
    const tenantId = context.tenantId

    // Get translation metrics for trends
    const metrics = await prisma.translationMetrics.findMany({
      where: {
        tenantId,
      },
      select: {
        date: true,
        usersWithEnglish: true,
        usersWithArabic: true,
        usersWithHindi: true,
      },
      orderBy: {
        date: 'asc',
      },
      take: 30, // Last 30 days
    })

    const trends = metrics.map((m) => ({
      date: m.date,
      en: m.usersWithEnglish,
      ar: m.usersWithArabic,
      hi: m.usersWithHindi,
    }))

    Sentry.addBreadcrumb({
      category: 'analytics.trends',
      message: 'Language adoption trends queried',
      level: 'info',
      data: {
        daysOfData: trends.length,
      },
    })

    return NextResponse.json({ data: trends })
  } catch (error) {
    console.error('Failed to fetch language adoption trends:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to fetch language adoption trends' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/user-language-analytics/snapshot
 * Record a snapshot of current language distribution
 */
export const POST = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    const tenantId = ctx.tenantId

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant context missing' },
        { status: 400 }
      )
    }

    // Get current analytics
    const users = await prisma.userProfile.findMany({
      where: {
        user: {
          tenantId,
        },
      },
      select: {
        preferredLanguage: true,
      },
    })

    const languageCount: Record<string, number> = {}
    for (const profile of users) {
      const lang = profile.preferredLanguage || 'en'
      languageCount[lang] = (languageCount[lang] || 0) + 1
    }

    // Create or update metrics snapshot
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const snapshot = await prisma.translationMetrics.upsert({
      where: {
        tenantId_date: {
          tenantId,
          date: today,
        },
      },
      create: {
        tenantId,
        date: today,
        totalUniqueKeys: 0,
        usersWithArabic: languageCount['ar'] || 0,
        usersWithHindi: languageCount['hi'] || 0,
        usersWithEnglish: languageCount['en'] || 0,
        enCoveragePct: 100,
        arCoveragePct: 0,
        hiCoveragePct: 0,
      },
      update: {
        usersWithArabic: languageCount['ar'] || 0,
        usersWithHindi: languageCount['hi'] || 0,
        usersWithEnglish: languageCount['en'] || 0,
      },
    })

    Sentry.addBreadcrumb({
      category: 'analytics.snapshot',
      message: 'Language distribution snapshot recorded',
      level: 'info',
    })

    return NextResponse.json({ data: snapshot }, { status: 201 })
  } catch (error) {
    console.error('Failed to record language analytics snapshot:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to record language analytics snapshot' },
      { status: 500 }
    )
  }
})

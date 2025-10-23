import type { Handler, HandlerEvent } from '@netlify/functions'
import prisma from '@/lib/prisma'

/**
 * Cron Job: Daily Translation Metrics Collection
 * 
 * Scheduled to run daily (midnight UTC)
 * Collects translation coverage metrics for all tenants
 * 
 * Netlify schedule: @daily or 0 0 * * * (cron syntax)
 * 
 * Metrics collected:
 * - Total translation keys per language
 * - Translation completion % per language
 * - User distribution by language preference
 * - Timestamp for trending analysis
 */
export const handler: Handler = async (event: HandlerEvent) => {
  // Verify this is a scheduled event (Netlify cron)
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    }
  }

  const startTime = Date.now()
  const results: {
    tenantsProcessed: number
    metricsCreated: number
    errors: string[]
  } = {
    tenantsProcessed: 0,
    metricsCreated: 0,
    errors: [],
  }

  try {
    console.log('[cron-translation-metrics] Starting daily metrics collection...')

    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      select: { id: true },
    })

    console.log(`[cron-translation-metrics] Processing ${tenants.length} tenants`)

    // Process each tenant
    for (const tenant of tenants) {
      try {
        await collectTenantMetrics(tenant.id)
        results.tenantsProcessed++
        results.metricsCreated++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error(`[cron-translation-metrics] Error processing tenant ${tenant.id}:`, errorMsg)
        results.errors.push(`Tenant ${tenant.id}: ${errorMsg}`)
      }
    }

    const duration = Date.now() - startTime
    console.log(
      `[cron-translation-metrics] Completed in ${duration}ms. ` +
        `Processed ${results.tenantsProcessed} tenants, created ${results.metricsCreated} metric records`
    )

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Translation metrics collected successfully',
        ...results,
        duration,
      }),
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[cron-translation-metrics] Fatal error:', errorMsg)

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: errorMsg,
        processed: results.tenantsProcessed,
      }),
    }
  }
}

/**
 * Collect metrics for a single tenant
 */
async function collectTenantMetrics(tenantId: string): Promise<void> {
  // Get all translation keys for this tenant
  const allKeys = await prisma.translationKey.findMany({
    where: { tenantId },
    select: {
      enTranslated: true,
      arTranslated: true,
      hiTranslated: true,
    },
  })

  const totalKeys = allKeys.length

  if (totalKeys === 0) {
    console.log(`[cron-translation-metrics] Tenant ${tenantId} has no translation keys, skipping`)
    return
  }

  // Calculate coverage
  const enTranslated = allKeys.filter(k => k.enTranslated).length
  const arTranslated = allKeys.filter(k => k.arTranslated).length
  const hiTranslated = allKeys.filter(k => k.hiTranslated).length

  // Get user distribution by language
  const usersByLanguage = await prisma.userProfile.groupBy({
    by: ['preferredLanguage'],
    where: { user: { tenantId } },
    _count: { preferredLanguage: true },
  })

  const usersWithEnglish = usersByLanguage.find(g => g.preferredLanguage === 'en')?._count.preferredLanguage || 0
  const usersWithArabic = usersByLanguage.find(g => g.preferredLanguage === 'ar')?._count.preferredLanguage || 0
  const usersWithHindi = usersByLanguage.find(g => g.preferredLanguage === 'hi')?._count.preferredLanguage || 0

  // Calculate percentages
  const enCoveragePct = ((enTranslated / totalKeys) * 100).toFixed(2)
  const arCoveragePct = ((arTranslated / totalKeys) * 100).toFixed(2)
  const hiCoveragePct = ((hiTranslated / totalKeys) * 100).toFixed(2)

  // Get today's date in UTC
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // Create or update metrics record for today
  const metrics = await prisma.translationMetrics.upsert({
    where: {
      tenantId_date: {
        tenantId,
        date: today,
      },
    },
    update: {
      enTotal: totalKeys,
      enTranslated,
      arTotal: totalKeys,
      arTranslated,
      hiTotal: totalKeys,
      hiTranslated,
      totalUniqueKeys: totalKeys,
      usersWithEnglish,
      usersWithArabic,
      usersWithHindi,
      enCoveragePct: parseFloat(enCoveragePct),
      arCoveragePct: parseFloat(arCoveragePct),
      hiCoveragePct: parseFloat(hiCoveragePct),
    },
    create: {
      tenantId,
      date: today,
      enTotal: totalKeys,
      enTranslated,
      arTotal: totalKeys,
      arTranslated,
      hiTotal: totalKeys,
      hiTranslated,
      totalUniqueKeys: totalKeys,
      usersWithEnglish,
      usersWithArabic,
      usersWithHindi,
      enCoveragePct: parseFloat(enCoveragePct),
      arCoveragePct: parseFloat(arCoveragePct),
      hiCoveragePct: parseFloat(hiCoveragePct),
    },
  })

  console.log(
    `[cron-translation-metrics] Tenant ${tenantId}: ` +
      `EN=${enCoveragePct}% AR=${arCoveragePct}% HI=${hiCoveragePct}% ` +
      `(EN:${usersWithEnglish} AR:${usersWithArabic} HI:${usersWithHindi} users)`
  )
}

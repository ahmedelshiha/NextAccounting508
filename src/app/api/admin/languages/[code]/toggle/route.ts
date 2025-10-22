import { NextRequest, NextResponse } from 'next/server'
import { requireTenantContext } from '@/lib/tenant-utils'
import { withTenantContext } from '@/lib/api-wrapper'
import { toggleLanguageStatus } from '@/lib/language-registry'
import { logAudit } from '@/lib/audit'
import * as Sentry from '@sentry/nextjs'

/**
 * POST /api/admin/languages/[code]/toggle
 * Toggle language enabled/disabled status (admin only)
 */
export const POST = withTenantContext(async (request: NextRequest, { params }: { params: { code: string } }) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const code = params.code

    const updated = await toggleLanguageStatus(code)

    // Log audit event
    try {
      await logAudit({
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        action: 'LANGUAGE_TOGGLED',
        resourceType: 'LANGUAGE',
        resourceId: code,
        changes: {
          before: { enabled: !updated.enabled },
          after: { enabled: updated.enabled }
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError)
    }

    Sentry.addBreadcrumb({
      category: 'admin.languages',
      message: 'Language toggled',
      level: 'info',
      data: { code, enabled: updated.enabled }
    })

    return NextResponse.json(updated)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)

    if (errorMsg.includes('Cannot disable default language')) {
      return NextResponse.json(
        { error: 'Cannot disable default language (en)' },
        { status: 400 }
      )
    }

    if (errorMsg.includes('not found')) {
      return NextResponse.json(
        { error: `Language ${params.code} not found` },
        { status: 404 }
      )
    }

    console.error('Failed to toggle language:', error)
    Sentry.captureException(error, {
      tags: { endpoint: 'admin.languages.toggle', code: params.code }
    })
    return NextResponse.json(
      { error: 'Failed to toggle language' },
      { status: 500 }
    )
  }
})

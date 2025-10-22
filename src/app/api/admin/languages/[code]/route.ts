import { NextRequest, NextResponse } from 'next/server'
import { requireTenantContext } from '@/lib/tenant-utils'
import { withTenantContext } from '@/lib/api-wrapper'
import {
  getLanguageByCode,
  deleteLanguage,
  upsertLanguage
} from '@/lib/language-registry'
import { logAudit } from '@/lib/audit'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

const UpdateLanguageSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nativeName: z.string().min(1).max(100).optional(),
  direction: z.enum(['ltr', 'rtl']).optional(),
  flag: z.string().max(5).optional(),
  bcp47Locale: z.string().min(2).max(10).optional(),
  enabled: z.boolean().optional()
})

/**
 * PUT /api/admin/languages/[code]
 * Update a language configuration (admin only)
 */
export const PUT = withTenantContext(async (request: NextRequest, { params }: { params: { code: string } }) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const code = params.code

    // Get current language
    const current = await getLanguageByCode(code)
    if (!current) {
      return NextResponse.json(
        { error: `Language ${code} not found` },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = UpdateLanguageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data
    const updated = await upsertLanguage(code, data)

    // Log audit event
    try {
      await logAudit({
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        action: 'LANGUAGE_UPDATED',
        resourceType: 'LANGUAGE',
        resourceId: code,
        changes: {
          before: current,
          after: updated
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError)
    }

    Sentry.addBreadcrumb({
      category: 'admin.languages',
      message: 'Language updated',
      level: 'info',
      data: { code, fields: Object.keys(data) }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update language:', error)
    Sentry.captureException(error, {
      tags: { endpoint: 'admin.languages.put', code: params.code }
    })
    return NextResponse.json(
      { error: 'Failed to update language' },
      { status: 500 }
    )
  }
})

/**
 * DELETE /api/admin/languages/[code]
 * Delete a language (admin only)
 */
export const DELETE = withTenantContext(async (request: NextRequest, { params }: { params: { code: string } }) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const code = params.code

    // Get current language
    const current = await getLanguageByCode(code)
    if (!current) {
      return NextResponse.json(
        { error: `Language ${code} not found` },
        { status: 404 }
      )
    }

    await deleteLanguage(code)

    // Log audit event
    try {
      await logAudit({
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        action: 'LANGUAGE_DELETED',
        resourceType: 'LANGUAGE',
        resourceId: code,
        changes: {
          before: current,
          after: null
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError)
    }

    Sentry.addBreadcrumb({
      category: 'admin.languages',
      message: 'Language deleted',
      level: 'info',
      data: { code }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)

    // Handle specific error cases
    if (errorMsg.includes('Cannot delete default language')) {
      return NextResponse.json(
        { error: 'Cannot delete default language (en)' },
        { status: 400 }
      )
    }

    if (errorMsg.includes('Cannot delete language')) {
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      )
    }

    console.error('Failed to delete language:', error)
    Sentry.captureException(error, {
      tags: { endpoint: 'admin.languages.delete', code: params.code }
    })
    return NextResponse.json(
      { error: 'Failed to delete language' },
      { status: 500 }
    )
  }
})

import { NextRequest, NextResponse } from 'next/server'
import { requireTenantContext } from '@/lib/tenant-utils'
import { withTenantContext } from '@/lib/api-wrapper'
import {
  getAllLanguages,
  getEnabledLanguages,
  upsertLanguage,
  getLanguageByCode
} from '@/lib/language-registry'
import { logAudit } from '@/lib/audit'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

const CreateLanguageSchema = z.object({
  code: z.string().min(2).max(10),
  name: z.string().min(1).max(100),
  nativeName: z.string().min(1).max(100),
  direction: z.enum(['ltr', 'rtl']),
  flag: z.string().max(5).optional(),
  bcp47Locale: z.string().min(2).max(10),
  enabled: z.boolean().default(true)
})

/**
 * GET /api/admin/languages
 * Retrieve all languages (admin only)
 */
export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const languages = await getAllLanguages()
    return NextResponse.json({
      data: languages,
      count: languages.length
    })
  } catch (error) {
    console.error('Failed to fetch languages:', error)
    Sentry.captureException(error, {
      tags: { endpoint: 'admin.languages.get' }
    })
    return NextResponse.json(
      { error: 'Failed to fetch languages' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/admin/languages
 * Create a new language (admin only)
 */
export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = CreateLanguageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if language already exists
    const existing = await getLanguageByCode(data.code)
    if (existing) {
      return NextResponse.json(
        { error: `Language ${data.code} already exists` },
        { status: 409 }
      )
    }

    // Create the language
    const language = await upsertLanguage(data.code, data)

    // Log audit event
    try {
      await logAudit({
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        action: 'LANGUAGE_CREATED',
        resourceType: 'LANGUAGE',
        resourceId: language.code,
        changes: {
          before: null,
          after: language
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError)
    }

    Sentry.addBreadcrumb({
      category: 'admin.languages',
      message: 'Language created',
      level: 'info',
      data: { code: language.code, name: language.name }
    })

    return NextResponse.json(language, { status: 201 })
  } catch (error) {
    console.error('Failed to create language:', error)
    Sentry.captureException(error, {
      tags: { endpoint: 'admin.languages.post' }
    })
    return NextResponse.json(
      { error: 'Failed to create language' },
      { status: 500 }
    )
  }
})

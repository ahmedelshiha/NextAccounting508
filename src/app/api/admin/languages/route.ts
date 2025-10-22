import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { getAllLanguages, upsertLanguage } from '@/lib/language-registry'

function json(payload: any, status = 200) { return NextResponse.json(payload, { status }) }

const LanguageBodySchema = z.object({
  code: z.string().min(2).max(16).regex(/^[a-z]{2}(-[A-Za-z0-9-]+)?$/).transform(v=>v.toLowerCase()),
  name: z.string().min(1).max(64),
  nativeName: z.string().min(1).max(64),
  direction: z.enum(['ltr','rtl']),
  flag: z.string().min(1).max(8).optional(),
  bcp47Locale: z.string().min(2).max(32),
  enabled: z.boolean().optional(),
})

export const GET = withTenantContext(async (_req: Request) => {
  const ctx = requireTenantContext()
  if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_VIEW)) {
    return json({ ok: false, error: 'Forbidden' }, 403)
  }
  try {
    const languages = await getAllLanguages()
    return json({ ok: true, data: languages })
  } catch (err: any) {
    return json({ ok: false, error: String(err?.message || 'Failed to load languages') }, 500)
  }
})

export const POST = withTenantContext(async (request: Request) => {
  const ctx = requireTenantContext()
  if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
    return json({ ok: false, error: 'Forbidden' }, 403)
  }
  let body: unknown
  try { body = await request.json() } catch { return json({ ok:false, error:'Invalid JSON body' }, 400) }
  const parsed = LanguageBodySchema.safeParse(body)
  if (!parsed.success) {
    return json({ ok:false, error:'Validation failed', issues: parsed.error.format() }, 400)
  }
  try {
    const lang = await upsertLanguage(parsed.data.code, parsed.data)
    return json({ ok:true, data: lang }, 201)
  } catch (err: any) {
    return json({ ok:false, error: String(err?.message || 'Failed to save language') }, 500)
  }
})

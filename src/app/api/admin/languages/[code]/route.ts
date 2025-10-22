import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { upsertLanguage, deleteLanguage } from '@/lib/language-registry'

function json(payload: any, status = 200) { return NextResponse.json(payload, { status }) }

const UpdateSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  nativeName: z.string().min(1).max(64).optional(),
  direction: z.enum(['ltr','rtl']).optional(),
  flag: z.string().min(1).max(8).optional(),
  bcp47Locale: z.string().min(2).max(32).optional(),
  enabled: z.boolean().optional(),
})

export const PUT = withTenantContext(async (request: Request, { params }: { params: { code: string } }) => {
  const ctx = requireTenantContext()
  if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
    return json({ ok: false, error: 'Forbidden' }, 403)
  }
  const code = String(params?.code || '').toLowerCase()
  if (!code || !/^[a-z]{2}(-[a-z0-9-]+)?$/.test(code)) return json({ ok:false, error:'Invalid language code' }, 400)
  let body: unknown
  try { body = await request.json() } catch { return json({ ok:false, error:'Invalid JSON body' }, 400) }
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return json({ ok:false, error:'Validation failed', issues: parsed.error.format() }, 400)
  try {
    const saved = await upsertLanguage(code, parsed.data)
    return json({ ok:true, data: saved })
  } catch (err:any) {
    return json({ ok:false, error: String(err?.message || 'Failed to update language') }, 500)
  }
})

export const DELETE = withTenantContext(async (_req: Request, { params }: { params: { code: string } }) => {
  const ctx = requireTenantContext()
  if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
    return json({ ok: false, error: 'Forbidden' }, 403)
  }
  const code = String(params?.code || '').toLowerCase()
  if (!code || !/^[a-z]{2}(-[a-z0-9-]+)?$/.test(code)) return json({ ok:false, error:'Invalid language code' }, 400)
  try {
    await deleteLanguage(code)
    return json({ ok:true })
  } catch (err:any) {
    return json({ ok:false, error: String(err?.message || 'Failed to delete language') }, 400)
  }
})

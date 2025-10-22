import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { toggleLanguageStatus } from '@/lib/language-registry'

function json(payload: any, status = 200) { return NextResponse.json(payload, { status }) }

export const PATCH = withTenantContext(async (_req: Request, { params }: { params: { code: string } }) => {
  const ctx = requireTenantContext()
  if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.LANGUAGES_MANAGE)) {
    return json({ ok: false, error: 'Forbidden' }, 403)
  }
  const code = String(params?.code || '').toLowerCase()
  if (!code || !/^[a-z]{2}(-[a-z0-9-]+)?$/.test(code)) return json({ ok:false, error:'Invalid language code' }, 400)
  try {
    const updated = await toggleLanguageStatus(code)
    return json({ ok:true, data: updated })
  } catch (err:any) {
    return json({ ok:false, error: String(err?.message || 'Failed to toggle language status') }, 400)
  }
})

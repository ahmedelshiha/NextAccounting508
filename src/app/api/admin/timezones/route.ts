import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { getTimezonesWithOffsets } from '@/lib/timezone-helper'

export const GET = withTenantContext(async (_req: Request) => {
  const ctx = requireTenantContext()
  if (!ctx || !ctx.role || !hasPermission(ctx.role, PERMISSIONS.ORG_SETTINGS_VIEW)) {
    return NextResponse.json({ ok:false, error:'Forbidden' }, { status: 403 })
  }
  const data = getTimezonesWithOffsets(new Date())
  const res = NextResponse.json({ ok:true, data })
  try { res.headers.set('Cache-Control', 'public, max-age=86400, immutable') } catch {}
  return res
})

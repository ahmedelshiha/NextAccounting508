import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { logAudit } from '@/lib/audit'

export const POST = withTenantContext(async (request: Request) => {
  try {
    const ctx = requireTenantContext()
    const actorId = ctx.userId ?? null
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    try { await logAudit({ action: 'auth:logout', actorId, targetId: actorId, details: { ip } }) } catch {}
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
})

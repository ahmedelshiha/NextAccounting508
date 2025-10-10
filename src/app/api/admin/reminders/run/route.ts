import { NextRequest, NextResponse } from 'next/server'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export const runtime = 'nodejs'

import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const POST = withTenantContext(async (_req: NextRequest) => {
  const ctx = requireTenantContext()
  const role = ctx.role ?? undefined
  if (!hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const mod = await import('@/app/api/cron/reminders/route')
    const secret = process.env.CRON_SECRET || process.env.NEXT_CRON_SECRET || ''
    const internalReq = new Request('https://internal/cron/reminders', { method: 'POST', headers: secret ? { 'x-cron-secret': secret } : {} as any })
    const resp: any = await mod.POST(internalReq as any, { params: {} } as any)
    const json = await resp.json().catch(() => null)
    return NextResponse.json(json, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to trigger reminders' }, { status: 500 })
  }
}, { requireAuth: false })

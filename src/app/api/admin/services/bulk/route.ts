import { NextRequest, NextResponse } from 'next/server'
import { ServicesService } from '@/services/services.service'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { BulkActionSchema } from '@/schemas/services'
import { logAudit } from '@/lib/audit'
import { makeErrorBody, mapPrismaError, mapZodError, isApiError } from '@/lib/api/error-responses'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

const svc = new ServicesService()

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role as string | undefined
    if (!ctx.userId || !hasPermission(role, PERMISSIONS.SERVICES_BULK_EDIT)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const ip = getClientIp(request as any)
    const tenantKey = ctx.tenantId || 'global'
    const key = `bulk:${tenantKey}:${ip}`
    const rl = await applyRateLimit(key, 10, 60_000)
    if (rl && rl.allowed === false) {
      try { await logAudit({ action: 'security.ratelimit.block', actorId: ctx.userId ?? null, details: { tenantId: ctx.tenantId ?? null, ip, key, route: new URL(request.url).pathname } }) } catch {}
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    try { console.log('[services bulk] applyRateLimit ->', JSON.stringify(rl)) } catch {}

    const body = await request.json()
    const data = BulkActionSchema.parse(body)

    const result = await svc.performBulkAction(ctx.tenantId, data as any, ctx.userId)

    await logAudit({ action: 'SERVICES_BULK_ACTION', actorId: ctx.userId, details: { action: data.action, count: result.updatedCount } })

    if (result.errors && result.errors.length) {
      return NextResponse.json({ message: `Completed with errors: ${result.updatedCount} succeeded, ${result.errors.length} failed`, result }, { status: 207 })
    }

    return NextResponse.json({ message: `Successfully ${data.action} ${result.updatedCount} services`, result })
  } catch (e: any) {
    const prismaMapped = mapPrismaError(e)
    if (prismaMapped) return NextResponse.json(makeErrorBody(prismaMapped), { status: prismaMapped.status })
    if (e?.name === 'ZodError') {
      const apiErr = mapZodError(e)
      return NextResponse.json(makeErrorBody(apiErr), { status: apiErr.status })
    }
    if (isApiError(e)) return NextResponse.json(makeErrorBody(e), { status: e.status })
    console.error('bulk error', e)
    return NextResponse.json(makeErrorBody(e), { status: 500 })
  }
})

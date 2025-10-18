import { NextRequest, NextResponse } from 'next/server'
import { ServicesService } from '@/services/services.service'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { makeErrorBody, mapPrismaError, mapZodError, isApiError } from '@/lib/api/error-responses'
import { applyRateLimit, getClientIp } from '@/lib/rate-limit'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

const svc = new ServicesService()

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role as string | undefined
    if (!ctx.userId || !hasPermission(role, PERMISSIONS.SERVICES_EXPORT)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const ip = getClientIp(request as any)
    const tenantKey = ctx.tenantId || 'global'
    const key = `export:${tenantKey}:${ip}`
    const rl = await applyRateLimit(key, 5, 60_000)
    if (!rl.allowed) {
      try { const { logAudit } = await import('@/lib/audit'); await logAudit({ action: 'security.ratelimit.block', actorId: ctx.userId ?? null, details: { tenantId: ctx.tenantId ?? null, ip, key, route: new URL(request.url).pathname } }) } catch {}
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const sp = new URL(request.url).searchParams
    const format = (sp.get('format') === 'json' ? 'json' : 'csv') as 'csv' | 'json'
    const includeInactive = sp.get('includeInactive') === 'true'

    const data = await svc.exportServices(ctx.tenantId, { format, includeInactive })

    const ts = new Date().toISOString().split('T')[0]
    const filename = `services-export-${ts}.${format}`

    if (format === 'csv') {
      return new NextResponse(data, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${filename}"` } })
    }

    return NextResponse.json(JSON.parse(data))
  } catch (e: any) {
    const prismaMapped = mapPrismaError(e)
    if (prismaMapped) return NextResponse.json(makeErrorBody(prismaMapped), { status: prismaMapped.status })
    if (e?.name === 'ZodError') {
      const apiErr = mapZodError(e)
      return NextResponse.json(makeErrorBody(apiErr), { status: apiErr.status })
    }
    if (isApiError(e)) return NextResponse.json(makeErrorBody(e), { status: e.status })
    console.error('export error', e)
    return NextResponse.json(makeErrorBody(e), { status: 500 })
  }
})

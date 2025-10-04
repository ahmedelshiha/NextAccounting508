import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { ServicesService } from '@/services/services.service'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { makeErrorBody, mapPrismaError, mapZodError, isApiError } from '@/lib/api/error-responses'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

const svc = new ServicesService()

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role as string | undefined
    if (!ctx.userId || !hasPermission(role, PERMISSIONS.SERVICES_ANALYTICS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const sp = new URL(request.url).searchParams
    const range = sp.get('range') || '30d'

    const stats = await svc.getServiceStats(ctx.tenantId, range)
    return NextResponse.json(stats, { headers: { 'Cache-Control': 'private, max-age=300' } })
  } catch (e: any) {
    const prismaMapped = mapPrismaError(e)
    if (prismaMapped) return NextResponse.json(makeErrorBody(prismaMapped), { status: prismaMapped.status })
    if (e?.name === 'ZodError') {
      const apiErr = mapZodError(e)
      return NextResponse.json(makeErrorBody(apiErr), { status: apiErr.status })
    }
    if (isApiError(e)) return NextResponse.json(makeErrorBody(e), { status: e.status })
    Sentry.captureException(e)
    console.error('stats error', e)
    return NextResponse.json(makeErrorBody(e), { status: 500 })
  }
})

import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'
import { fetchRates } from '@/lib/exchange'
import { respond } from '@/lib/api-response'

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
      return respond.forbidden('Forbidden')
    }

    const body = await request.json().catch(() => ({}))
    const base = (body.base as string) || process.env.EXCHANGE_BASE_CURRENCY || 'USD'
    const targets = (body.targets as string[]) || []

    if (targets.length === 0) {
      const active = await prisma.currency.findMany({ where: { active: true } })
      for (const t of active) {
        if (t.code !== base) targets.push(t.code)
      }
    }

    const res = await fetchRates(targets, base)
    return NextResponse.json(res)
  } catch (e) {
    console.error('POST /api/admin/currencies/refresh error', e)
    return NextResponse.json({ error: 'Failed to refresh rates' }, { status: 500 })
  }
})

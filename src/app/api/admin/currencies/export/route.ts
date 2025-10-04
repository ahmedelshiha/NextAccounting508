import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'

export const GET = withTenantContext(async (_request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const base = process.env.EXCHANGE_BASE_CURRENCY || 'USD'
    const currencies = await prisma.currency.findMany({ orderBy: { code: 'asc' } })
    const rows = await Promise.all(currencies.map(async (c) => {
      const rate = await prisma.exchangeRate.findFirst({ where: { base, target: c.code }, orderBy: { fetchedAt: 'desc' } })
      return [c.code, c.name, c.symbol ?? '', String(c.decimals), String(c.active), String(c.isDefault), String(rate?.rate ?? '')].join(',')
    }))

    const csv = ['code,name,symbol,decimals,active,isDefault,lastRate', ...rows].join('\n')
    return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="currencies.csv"' } })
  } catch (e) {
    console.error('GET /api/admin/currencies/export error', e)
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 })
  }
})

export const PATCH = withTenantContext(async (request: NextRequest, context: { params: Promise<{ code: string }> }) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const code = params.code.toUpperCase()
    const body = await request.json()

    if (body.isDefault) {
      await prisma.currency.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }

    const updated = await prisma.currency.update({ where: { code }, data: body })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH /api/admin/currencies/[code] error', e)
    return NextResponse.json({ error: 'Failed to update currency' }, { status: 500 })
  }
})

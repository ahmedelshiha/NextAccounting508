import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { respond } from '@/lib/api-response'

// GET /api/admin/currencies - list all currencies
export const GET = withTenantContext(async (_request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) return respond.forbidden('Forbidden')

    const base = process.env.EXCHANGE_BASE_CURRENCY || 'USD'
    const currencies = await prisma.currency.findMany({ orderBy: { isDefault: 'desc' } })

    const result = await Promise.all(currencies.map(async (c) => {
      const rate = await prisma.exchangeRate.findFirst({ where: { base, target: c.code }, orderBy: { fetchedAt: 'desc' } })
      return { ...c, lastRate: rate?.rate ?? null }
    }))

    return NextResponse.json(result)
  } catch (e) {
    console.error('GET /api/admin/currencies error', e)
    return NextResponse.json({ error: 'Failed to fetch currencies' }, { status: 500 })
  }
})

// POST /api/admin/currencies - create a new currency
export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.TEAM_MANAGE)) {
      return respond.forbidden('Forbidden')
    }

    const body = await request.json()
    const { code, name, symbol, decimals = 2, active = false, isDefault = false } = body
    if (!code || !name) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    // If setting default, clear previous default
    if (isDefault) {
      await prisma.currency.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }

    const created = await prisma.currency.create({ data: { code: code.toUpperCase(), name, symbol, decimals, active, isDefault } })

    return NextResponse.json(created)
  } catch (e) {
    console.error('POST /api/admin/currencies error', e)
    return NextResponse.json({ error: 'Failed to create currency' }, { status: 500 })
  }
})

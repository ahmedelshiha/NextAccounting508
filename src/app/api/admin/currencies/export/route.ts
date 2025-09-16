import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import prisma from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.ANALYTICS_VIEW)) {
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
}

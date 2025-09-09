import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission } from '@/lib/rbac'

// GET /api/admin/currencies - list all currencies
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission(session.user.role, 'view_currencies')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
}

// POST /api/admin/currencies - create a new currency
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !hasPermission(session.user.role, 'manage_currencies')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
}

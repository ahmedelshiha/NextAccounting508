import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const base = process.env.EXCHANGE_BASE_CURRENCY || 'USD'
    const currencies = await prisma.currency.findMany({ where: { active: true }, orderBy: { isDefault: 'desc' } })
    const result = await Promise.all(currencies.map(async (c) => {
      const rate = await prisma.exchangeRate.findFirst({ where: { base, target: c.code }, orderBy: { fetchedAt: 'desc' } })
      return { code: c.code, name: c.name, symbol: c.symbol, active: c.active, isDefault: c.isDefault, decimals: c.decimals, lastRate: rate?.rate ?? null }
    }))
    return NextResponse.json(result)
  } catch (e) {
    console.error('GET /api/currencies error', e)
    return NextResponse.json({ error: 'Failed to fetch currencies' }, { status: 500 })
  }
}

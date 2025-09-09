import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = (searchParams.get('from') || process.env.EXCHANGE_BASE_CURRENCY || 'USD').toUpperCase()
    const to = (searchParams.get('to') || '').toUpperCase()
    const amount = Number(searchParams.get('amount') || '0')
    if (!to || !amount) return NextResponse.json({ error: 'Invalid params' }, { status: 400 })

    const rate = await prisma.exchangeRate.findFirst({ where: { base: from, target: to }, orderBy: { fetchedAt: 'desc' } })
    if (!rate) return NextResponse.json({ error: 'Rate not found' }, { status: 404 })

    const converted = (amount * rate.rate)
    return NextResponse.json({ from, to, amount, rate: rate.rate, converted })
  } catch (e) {
    console.error('GET /api/currencies/convert error', e)
    return NextResponse.json({ error: 'Failed to convert' }, { status: 500 })
  }
}

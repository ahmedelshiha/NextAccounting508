import { NextRequest, NextResponse } from 'next/server'
import { authorizeCron } from '@/lib/cron/scheduler'
import { refreshExchangeRates } from '@/lib/cron/exchange'

export async function POST(request: NextRequest) {
  const auth = authorizeCron(request)
  if (auth) return auth
  try {
    const res = await refreshExchangeRates()
    return NextResponse.json(res)
  } catch (e) {
    console.error('POST /api/cron/refresh-exchange-rates error', e)
    return NextResponse.json({ error: 'Failed to run refresh' }, { status: 500 })
  }
}

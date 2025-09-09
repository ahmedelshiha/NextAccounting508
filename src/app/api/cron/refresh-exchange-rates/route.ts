import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { fetchRates } from '@/lib/exchange'
import { logAudit } from '@/lib/audit'

type FetchResult = { success?: boolean; updated?: { target: string; rate: number; fetchedAt: string }[]; error?: string }

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-cron-secret') || ''
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const base = process.env.EXCHANGE_BASE_CURRENCY || 'USD'
    const active = await prisma.currency.findMany({ where: { active: true } })
    const targets = active.map((c) => c.code).filter((c) => c !== base)

    const resRaw = await fetchRates(targets, base)
    const res = resRaw as FetchResult

    if (res && res.success) {
      await logAudit({ action: 'exchange:refresh', details: { base, updated: res.updated } })
      return NextResponse.json({ success: true, updated: res.updated })
    }

    await logAudit({ action: 'exchange:refresh:failed', details: { error: res.error ?? 'unknown' } })
    return NextResponse.json({ success: false }, { status: 500 })
  } catch (e) {
    console.error('POST /api/cron/refresh-exchange-rates error', e)
    return NextResponse.json({ error: 'Failed to run refresh' }, { status: 500 })
  }
}

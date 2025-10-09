import prisma from '@/lib/prisma'
import { fetchRates } from '@/lib/exchange'
import { logAudit } from '@/lib/audit'

export type ExchangeUpdate = { target: string; rate: number; fetchedAt: string }
export type ExchangeRefreshResult = { success: boolean; updated: ExchangeUpdate[] }

export async function refreshExchangeRates(baseCurrency?: string): Promise<ExchangeRefreshResult> {
  const base = baseCurrency || process.env.EXCHANGE_BASE_CURRENCY || 'USD'
  const active = await prisma.currency.findMany({ where: { active: true } })
  const targets = active.map((c) => c.code).filter((c) => c !== base)

  const resRaw = await fetchRates(targets, base)
  const res = resRaw as { success?: boolean; updated?: ExchangeUpdate[]; error?: string }

  if (res && res.success) {
    try { await logAudit({ action: 'exchange:refresh', details: { base, updated: res.updated } }) } catch {}
    return { success: true, updated: res.updated || [] }
  }

  try { await logAudit({ action: 'exchange:refresh:failed', details: { error: res?.error ?? 'unknown' } }) } catch {}
  throw new Error(res?.error || 'Failed to refresh exchange rates')
}

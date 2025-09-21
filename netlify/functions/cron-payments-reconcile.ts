import type { Handler } from '@netlify/functions'

export const handler: Handler = async () => {
  const { STRIPE_SECRET_KEY } = process.env as Record<string, string | undefined>
  if (!STRIPE_SECRET_KEY) {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: false, reason: 'Payments not configured' }),
    }
  }

  try {
    const StripeMod = await import('stripe') as any
    const Stripe = StripeMod.default
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
    const prisma = (await import('@/lib/prisma')).default

    const since = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000)
    const sessions: any[] = []
    let startingAfter: string | undefined
    do {
      const page = await stripe.checkout.sessions.list({ created: { gte: since }, limit: 100, starting_after: startingAfter })
      sessions.push(...page.data)
      startingAfter = page.has_more ? page.data[page.data.length - 1]?.id : undefined
    } while (startingAfter)

    let updated = 0
    for (const s of sessions) {
      const srId = String(s?.metadata?.serviceRequestId || '')
      if (!srId) continue
      try {
        const sr = await prisma.serviceRequest.findUnique({ where: { id: srId } })
        if (!sr) continue
        let nextStatus: any = null
        if (s.status === 'complete' && s.payment_status === 'paid') nextStatus = 'PAID'
        else if (s.status === 'expired' || s.payment_status === 'unpaid') nextStatus = 'FAILED'
        if (nextStatus && sr.paymentStatus !== nextStatus) {
          await prisma.serviceRequest.update({
            where: { id: sr.id },
            data: {
              paymentStatus: nextStatus,
              paymentProvider: 'STRIPE' as any,
              paymentSessionId: s.id,
              paymentAmountCents: typeof s.amount_total === 'number' ? s.amount_total : sr.paymentAmountCents,
              paymentCurrency: (s.currency || sr.paymentCurrency || 'USD').toUpperCase(),
              paymentUpdatedAt: new Date(),
              paymentAttempts: (sr.paymentAttempts ?? 0) + 1,
            },
          })
          updated++
        }
      } catch {}
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, scanned: sessions.length, updated }),
    }
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(e?.message || 'error') }) }
  }
}

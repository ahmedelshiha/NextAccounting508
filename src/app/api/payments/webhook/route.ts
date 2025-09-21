export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY } = process.env as Record<string, string | undefined>
  if (!STRIPE_WEBHOOK_SECRET || !STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 501 })
  }

  const sig = request.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  try {
    const buf = Buffer.from(await request.arrayBuffer())
    const StripeMod = await import('stripe') as any
    const Stripe = StripeMod.default
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
    const event = stripe.webhooks.constructEvent(buf, sig, STRIPE_WEBHOOK_SECRET)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      try {
        const userId = String(session?.metadata?.userId || '')
        const serviceId = String(session?.metadata?.serviceId || '')
        const scheduledAtISO = String(session?.metadata?.scheduledAt || '')
        const scheduledAt = scheduledAtISO ? new Date(scheduledAtISO) : null
        let target: any = null
        try {
          if (userId && serviceId && scheduledAt) {
            target = await (await import('@/lib/prisma')).default.serviceRequest.findFirst({
              where: { clientId: userId, serviceId, scheduledAt },
            })
          }
          if (!target && userId && serviceId) {
            // fallback: latest submitted booking in last 24h for this user/service
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
            target = await (await import('@/lib/prisma')).default.serviceRequest.findFirst({
              where: { clientId: userId, serviceId, createdAt: { gte: since }, isBooking: true },
              orderBy: { createdAt: 'desc' },
            })
          }
        } catch {}
        if (target) {
          try {
            await (await import('@/lib/prisma')).default.serviceRequest.update({
              where: { id: target.id },
              data: {
                paymentStatus: 'PAID' as any,
                paymentProvider: 'STRIPE',
                paymentSessionId: session.id,
                paymentAmountCents: session.amount_total ?? null,
                paymentCurrency: (session.currency || '').toUpperCase() || null,
                paymentUpdatedAt: new Date(),
                paymentAttempts: (target.paymentAttempts ?? 0) + 1,
              }
            })
          } catch {}
        }
      } catch {}
    }

    if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
      const session = event.data.object as any
      const sessionId = session?.id || session?.checkout_session || null
      if (sessionId) {
        try {
          const prisma = (await import('@/lib/prisma')).default
          const sr = await prisma.serviceRequest.findFirst({ where: { paymentSessionId: sessionId } })
          if (sr) {
            await prisma.serviceRequest.update({ where: { id: sr.id }, data: { paymentStatus: 'FAILED' as any, paymentUpdatedAt: new Date(), paymentAttempts: (sr.paymentAttempts ?? 0) + 1 } })
          }
        } catch {}
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('stripe webhook error', err?.message)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

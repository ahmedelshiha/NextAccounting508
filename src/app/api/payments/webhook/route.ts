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
        // Placeholder for linking payments to service requests in future task
        console.log('Checkout completed:', { id: session.id, amount_total: session.amount_total, currency: session.currency, metadata: session.metadata })
      } catch {}
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('stripe webhook error', err?.message)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

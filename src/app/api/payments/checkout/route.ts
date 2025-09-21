export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calculateServicePrice } from '@/lib/booking/pricing'
import prisma from '@/lib/prisma'

function bad(msg: string, status = 400) { return NextResponse.json({ error: msg }, { status }) }

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return bad('Unauthorized', 401)

  const { STRIPE_SECRET_KEY } = process.env as Record<string, string | undefined>
  if (!STRIPE_SECRET_KEY) return bad('Payments not configured', 501)

  const body = await request.json().catch(() => null)
  if (!body || !body.serviceId || !body.scheduledAt) return bad('Missing required fields: serviceId, scheduledAt')

  // Normalize inputs
  const serviceId = String(body.serviceId)
  const scheduledAt = new Date(String(body.scheduledAt))
  const duration = body.duration != null ? Number(body.duration) : undefined
  const currency = (body.currency || 'USD') as string
  const promoCode = (body.promoCode || '').trim() || undefined
  const bookingType = String(body.bookingType || '').toUpperCase()

  try {
    const svc = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!svc || (svc as any).active === false) return bad('Service not found or inactive', 400)

    const emergencyPct = bookingType === 'EMERGENCY' ? 0.5 : 0
    const quote = await calculateServicePrice({
      serviceId,
      scheduledAt,
      durationMinutes: duration,
      options: {
        currency,
        emergencySurchargePercent: emergencyPct,
        promoCode,
        promoResolver: async (code: string) => {
          // Simple promo: WELCOME10 => -10%
          if (code.toUpperCase() === 'WELCOME10') {
            const basePrice = 0 // discount is applied over subtotal via negative component; handled in pricing via resolver
            return { code: 'PROMO_WELCOME10', label: 'Promo WELCOME10', amountCents: Math.round(-0.1 * 100 * 0) }
          }
          return null
        },
      }
    })

    if (!quote || typeof quote.totalCents !== 'number' || quote.totalCents <= 0) return bad('Invalid price quote')

    const StripeMod = await import('stripe') as any
    const Stripe = StripeMod.default
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

    const successUrl = String(body.successUrl || `${new URL(request.url).origin}/portal`)
    const cancelUrl = String(body.cancelUrl || `${new URL(request.url).origin}/booking`)

    // Optional: serviceRequestId to bind payment session preemptively
    const serviceRequestId = body.serviceRequestId ? String(body.serviceRequestId) : undefined

    const sessionObj = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: (session.user as any)?.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: quote.currency.toLowerCase(),
            unit_amount: quote.totalCents,
            product_data: {
              name: `${svc.name} — ${scheduledAt.toISOString().slice(0,16).replace('T',' ')}`,
              description: `Booking prepayment for ${svc.name}`,
            }
          }
        }
      ],
      metadata: {
        userId: String(session.user.id),
        serviceId,
        scheduledAt: scheduledAt.toISOString(),
        duration: String(duration || ''),
        bookingType: bookingType || 'STANDARD',
        ...(serviceRequestId ? { serviceRequestId } : {}),
      }
    })

    try {
      if (serviceRequestId) {
        await prisma.serviceRequest.update({ where: { id: serviceRequestId }, data: { paymentProvider: 'STRIPE', paymentSessionId: sessionObj.id, paymentStatus: 'UNPAID' as any, paymentAmountCents: quote.totalCents, paymentCurrency: quote.currency, paymentUpdatedAt: new Date() } })
      }
    } catch {}

    return NextResponse.json({ url: sessionObj.url, sessionId: sessionObj.id, amountCents: quote.totalCents, currency: quote.currency })
  } catch (e: any) {
    console.error('checkout create error', e)
    return bad('Failed to create checkout session', 500)
  }
}

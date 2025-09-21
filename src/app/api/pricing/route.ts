export const runtime = 'nodejs'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { respond, zodDetails } from '@/lib/api-response'

const Body = z.object({
  serviceId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().positive().optional(),
  currency: z.string().length(3).optional(),
  promoCode: z.string().optional(),
  bookingType: z.string().optional(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = Body.safeParse(body)
  if (!parsed.success) return respond.badRequest('Invalid payload', zodDetails(parsed.error))

  const { serviceId, scheduledAt, duration, currency, promoCode } = parsed.data
  try {
    const svc = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!svc || (svc as any).active === false) return respond.notFound('Service not found or inactive')

    const { calculateServicePrice } = await import('@/lib/booking/pricing')
    const bookingTypeNormalized = (bookingType || '').toUpperCase()
    const emergencyPct = bookingTypeNormalized === 'EMERGENCY' ? 0.5 : 0

    const price = await calculateServicePrice({
      serviceId,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: typeof duration === 'number' ? duration : (svc.duration ?? 60),
      options: {
        currency,
        promoCode: (promoCode || '').trim() || undefined,
        emergencySurchargePercent: emergencyPct,
        promoResolver: async (code: string, { serviceId }) => {
          const service = await prisma.service.findUnique({ where: { id: serviceId } })
          if (!service) return null
          const base = Number(service.price ?? 0)
          const baseCents = Math.round(base * 100)
          const uc = code.toUpperCase()
          if (uc === 'WELCOME10') return { code: 'PROMO_WELCOME10', label: 'Promo WELCOME10', amountCents: Math.round(baseCents * -0.1) }
          if (uc === 'SAVE15') return { code: 'PROMO_SAVE15', label: 'Promo SAVE15', amountCents: Math.round(baseCents * -0.15) }
          return null
        },
      },
    })

    return respond.ok(price)
  } catch (e) {
    return respond.serverError('Failed to calculate pricing')
  }
}

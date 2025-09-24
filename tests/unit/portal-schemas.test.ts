import { describe, it, expect } from 'vitest'
import { PortalCreateRequestSchema, PortalCreateBookingSchema, PortalCreateSchema } from '@/schemas/portal/service-requests'

describe('Portal Create Schemas', () => {
  it('parses a valid request (non-booking)', () => {
    const data = {
      serviceId: 'svc_1',
      title: 'Tax consultation request',
      description: 'Need help with filing',
      priority: 'high',
      deadline: new Date().toISOString(),
    }
    const parsed = PortalCreateRequestSchema.parse(data)
    expect(parsed.priority).toBe('HIGH')
    expect(parsed.isBooking).toBeUndefined()
  })

  it('parses a valid booking', () => {
    const data = {
      serviceId: 'svc_2',
      isBooking: true,
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      duration: 60,
      bookingType: 'STANDARD',
    }
    const parsed = PortalCreateBookingSchema.parse(data)
    expect(parsed.isBooking).toBe(true)
  })

  it('discriminates union correctly', () => {
    const a = PortalCreateSchema.safeParse({ serviceId: 'svc', isBooking: true, scheduledAt: new Date().toISOString() })
    const b = PortalCreateSchema.safeParse({ serviceId: 'svc', title: 'hello' })
    expect(a.success).toBe(true)
    expect(b.success).toBe(true)
  })
})

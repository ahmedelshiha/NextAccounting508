import { describe, it, expect } from 'vitest'
import { BookingSettingsStepsPayload, BookingSettingsBusinessHoursPayload, BookingSettingsPaymentMethodsPayload, BookingSettingsAutomationPayload, BookingSettingsIntegrationsPayload, BookingSettingsCapacityPayload, BookingSettingsFormsPayload } from '@/schemas/booking-settings.schemas'

describe('booking-settings schemas', () => {
  it('accepts valid steps payload', () => {
    const payload = { steps: [ { stepName: 'A', stepOrder: 1, enabled: true, required: true, title: 'A' } ] }
    const parsed = BookingSettingsStepsPayload.parse(payload)
    expect(parsed.steps.length).toBe(1)
    expect(parsed.steps[0].stepName).toBe('A')
  })

  it('rejects invalid steps payload (non-array)', () => {
    expect(() => BookingSettingsStepsPayload.parse({ steps: 'no' as any })).toThrow()
  })

  it('accepts valid business hours payload', () => {
    const payload = { businessHours: [ { dayOfWeek: 1, isWorkingDay: true, startTime: '09:00', endTime: '17:00' } ] }
    const parsed = BookingSettingsBusinessHoursPayload.parse(payload)
    expect(parsed.businessHours[0].dayOfWeek).toBe(1)
  })

  it('rejects invalid business hours payload', () => {
    expect(() => BookingSettingsBusinessHoursPayload.parse({ businessHours: 'x' as any })).toThrow()
  })

  it('accepts valid payment methods payload', () => {
    const payload = { paymentMethods: [ { methodType: 'CARD', enabled: true } ] }
    const parsed = BookingSettingsPaymentMethodsPayload.parse(payload)
    expect(parsed.paymentMethods[0].methodType).toBe('CARD')
  })

  it('rejects invalid payment methods payload', () => {
    expect(() => BookingSettingsPaymentMethodsPayload.parse({ paymentMethods: null as any })).toThrow()
  })
})

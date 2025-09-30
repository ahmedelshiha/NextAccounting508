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

  it('accepts valid automation payload', () => {
    const payload = { automation: { autoConfirm: true, confirmIf: 'known-client', followUps: [], cancellationPolicy: { hoursBefore: 24, feePercent: 0 } } }
    const parsed = BookingSettingsAutomationPayload.parse(payload)
    expect(parsed.automation.autoConfirm).toBe(true)
  })

  it('accepts valid integrations payload', () => {
    const payload = { integrations: { calendarSync: 'google', conferencing: 'none' } }
    const parsed = BookingSettingsIntegrationsPayload.parse(payload)
    expect(parsed.integrations.calendarSync).toBe('google')
  })

  it('accepts valid capacity payload', () => {
    const payload = { capacity: { pooledResources: true, concurrentLimit: 3, waitlist: true } }
    const parsed = BookingSettingsCapacityPayload.parse(payload)
    expect(parsed.capacity.concurrentLimit).toBe(3)
  })

  it('accepts valid forms payload', () => {
    const payload = { forms: { fields: [{ key: 'company', label: 'Company', type: 'text', required: false }], rules: [] } }
    const parsed = BookingSettingsFormsPayload.parse(payload)
    expect(parsed.forms.fields[0].key).toBe('company')
  })
})

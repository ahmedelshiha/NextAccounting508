import { describe, it, expect } from 'vitest'
import { ServiceSchema, BulkActionSchema } from '@/schemas/services'

describe('service schemas', () => {
  it('validates a correct service payload', () => {
    const data = {
      name: 'Consulting',
      slug: 'consulting',
      description: 'This is a detailed description about the consulting service.',
      shortDesc: 'Short summary',
      features: ['a','b'],
      price: 100,
      duration: 60,
      category: 'Business',
      featured: false,
      active: true,
    }
    const parsed = ServiceSchema.safeParse(data)
    expect(parsed.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const bad = { name: '', slug: 'x', description: 'short' }
    const parsed = ServiceSchema.safeParse(bad)
    expect(parsed.success).toBe(false)
  })

  it('bulk action schema requires service ids', () => {
    const ok = BulkActionSchema.safeParse({ action: 'delete', serviceIds: ['1'] })
    expect(ok.success).toBe(true)
    const bad = BulkActionSchema.safeParse({ action: 'delete', serviceIds: [] })
    expect(bad.success).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import { simulateExtract } from '@/components/expenses/receipt-scanner'

function todayIsoLocal() {
  const now = new Date()
  const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  return iso
}

describe('simulateExtract (receipt filename parser)', () => {
  it('extracts amount from filename with dot decimal and derives merchant', () => {
    const f = new File([new Uint8Array([1, 2, 3])], 'Starbucks_12.34.jpg', { type: 'image/jpeg' })
    const res = simulateExtract(f)
    expect(res.merchant).toBe('Starbucks 12.34')
    expect(res.total).toBe(12.34)
    expect(res.tax).toBe(0)
    expect(res.currency).toBe('USD')
    expect(res.date).toBe(todayIsoLocal())
    expect(res.category).toBe('general')
  })

  it('accepts comma decimal and normalizes to number', () => {
    const f = new File([new Uint8Array([1])], 'groceries-100,50.png', { type: 'image/png' })
    const res = simulateExtract(f)
    expect(res.total).toBe(100.5)
    expect(res.merchant).toBe('groceries 100,50')
  })

  it('defaults to safe values when amount not present', () => {
    const f = new File([new Uint8Array([1])], 'receipt.png', { type: 'image/png' })
    const res = simulateExtract(f)
    expect(res.total).toBe(0)
    expect(res.merchant).toBe('receipt')
  })
})

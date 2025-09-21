import { describe, it, expect } from 'vitest'
import { computeBackoffMs, isRetriableStatus } from '@/src/lib/offline/backoff'

describe('offline backoff utilities', () => {
  it('computes exponential backoff without jitter when jitterRatio=0', () => {
    const base = 100
    const factor = 2
    const max = 10000
    const opts = { baseMs: base, factor, maxMs: max, jitterRatio: 0 }
    expect(computeBackoffMs(0, opts)).toBe(100)
    expect(computeBackoffMs(1, opts)).toBe(200)
    expect(computeBackoffMs(2, opts)).toBe(400)
    expect(computeBackoffMs(3, opts)).toBe(800)
  })

  it('caps backoff at maxMs', () => {
    const opts = { baseMs: 1000, factor: 10, maxMs: 5000, jitterRatio: 0 }
    expect(computeBackoffMs(0, opts)).toBe(1000)
    expect(computeBackoffMs(1, opts)).toBe(5000)
    expect(computeBackoffMs(2, opts)).toBe(5000)
  })

  it('classifies retriable statuses', () => {
    expect(isRetriableStatus(0)).toBe(true) // network error
    expect(isRetriableStatus(408)).toBe(true)
    expect(isRetriableStatus(425)).toBe(true)
    expect(isRetriableStatus(429)).toBe(true)
    expect(isRetriableStatus(500)).toBe(true)
    expect(isRetriableStatus(599)).toBe(true)
    expect(isRetriableStatus(400)).toBe(false)
    expect(isRetriableStatus(404)).toBe(false)
    expect(isRetriableStatus(422)).toBe(false)
  })
})

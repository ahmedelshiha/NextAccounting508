import { describe, it, expect } from 'vitest'
import { toSecurityHealthPayload, type SystemHealth } from '@/lib/health'

describe('toSecurityHealthPayload', () => {
  it('maps operational to ok and includes checks', () => {
    const h: SystemHealth = {
      summary: { overall: 'operational', timestamp: new Date().toISOString() },
      db: { status: 'healthy' },
      email: { status: 'healthy' },
      auth: { status: 'healthy' },
      externalApis: [],
    }
    const payload = toSecurityHealthPayload(h)
    expect(payload.success).toBe(true)
    expect(payload.data.status).toBe('ok')
    expect(payload.data.checks).toEqual([
      { name: 'Database', status: 'healthy' },
      { name: 'Email', status: 'healthy' },
      { name: 'Auth', status: 'healthy' },
    ])
  })

  it('maps degraded overall status', () => {
    const h: SystemHealth = {
      summary: { overall: 'degraded', timestamp: new Date().toISOString() },
      db: { status: 'degraded', message: 'missing' },
      email: { status: 'healthy' },
      auth: { status: 'healthy' },
      externalApis: [],
    }
    const payload = toSecurityHealthPayload(h)
    expect(payload.data.status).toBe('degraded')
  })
})

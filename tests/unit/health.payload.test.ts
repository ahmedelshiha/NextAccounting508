import { describe, it, expect } from 'vitest'
import { toSecurityHealthPayload, SystemHealth } from '@/lib/health'

describe('health payload mapping', () => {
  it('maps system health to security payload shape', () => {
    const h: SystemHealth = {
      summary: { overall: 'degraded', timestamp: new Date().toISOString() },
      db: { status: 'degraded', message: 'missing' },
      email: { status: 'healthy' },
      auth: { status: 'healthy' },
      externalApis: [
        { name: 'Neon', status: 'degraded', message: 'DB URL missing' },
      ],
    }
    const payload = toSecurityHealthPayload(h)
    expect(payload.success).toBe(true)
    expect(payload.data.status).toBe('degraded')
    expect(Array.isArray(payload.data.checks)).toBe(true)
    expect(payload.data.checks.some((c: any) => c.name === 'Database')).toBe(true)
  })
})

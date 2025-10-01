import { describe, it, expect } from 'vitest'
import { getSystemStatus } from '@/lib/systemStatus'

describe('getSystemStatus', () => {
  it('returns correct flags from env', () => {
    const env = {
      NETLIFY_DATABASE_URL: 'postgres://x',
      NEXTAUTH_URL: 'https://auth',
      NEXTAUTH_SECRET: 's3cr3t',
      NODE_ENV: 'production',
    }
    const s = getSystemStatus(env as any)
    expect(s.database).toBe(true)
    expect(s.authentication.url).toBe(true)
    expect(s.authentication.secret).toBe(true)
    expect(s.environment.nodeEnv).toBe('production')
    expect(s.environment.databaseConfigured).toBe(true)
  })

  it('handles missing env values', () => {
    const env = {}
    const s = getSystemStatus(env as any)
    expect(s.database).toBe(false)
    expect(s.authentication.url).toBe(false)
    expect(s.authentication.secret).toBe(false)
    expect(s.environment.nodeEnv).toBe('development')
  })
})

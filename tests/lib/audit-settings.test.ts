import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => ({ ok: true, stored: false })) }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn() }))

import { auditSettingsChange } from '@/lib/audit-settings'
import { logAudit } from '@/lib/audit'

describe('auditSettingsChange', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls logAudit with expected payload', async () => {
    const actorId = 'user-1'
    const key = 'booking-settings'
    const before = { foo: 'bar' }
    const after = { foo: 'baz' }

    await auditSettingsChange(actorId, key, before, after)

    expect(logAudit).toHaveBeenCalledTimes(1)
    const calledWith = (logAudit as any).mock.calls[0][0]
    expect(calledWith.action).toBe(`${key}:update`)
    expect(calledWith.actorId).toBe(actorId)
    expect(calledWith.details).toBeDefined()
  })
})

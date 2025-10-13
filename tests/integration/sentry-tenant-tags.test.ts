import { describe, it, expect, vi, beforeEach } from 'vitest'

// Capture the processor registered by sentry.server.config.ts
let capturedProcessor: ((event: any) => any) | null = null

vi.mock('@sentry/nextjs', () => {
  return {
    init: vi.fn(),
    addEventProcessor: vi.fn((cb: any) => { capturedProcessor = cb }),
    // no-ops for other APIs that could be referenced
    withScope: (fn: any) => fn({ setTag: () => {}, setUser: () => {} }),
  }
})

describe('Sentry tenant tagging (server)', () => {
  beforeEach(async () => {
    vi.resetModules()
    capturedProcessor = null
    // Re-import the config to register the processor
    // Use dynamic import so our mock is applied first
    await import('@/sentry.server.config')
  })

  it('adds tenant tags and user fields when tenantContext is present', async () => {
    const { tenantContext } = await import('@/lib/tenant-context')

    const baseEvent: any = { level: 'error', message: 'boom', tags: {}, user: {} }
    expect(typeof capturedProcessor).toBe('function')

    const ctx = {
      tenantId: 't-abc',
      tenantSlug: 'alpha',
      userId: 'u-1',
      userEmail: 'u1@example.com',
      userName: 'User One',
      role: 'ADMIN',
      tenantRole: 'OWNER',
      isSuperAdmin: false,
      requestId: 'req-123',
      timestamp: new Date(),
    }

    const result = tenantContext.run(ctx as any, () => (capturedProcessor as any)(structuredClone(baseEvent)))

    expect(result.tags.tenantId).toBe('t-abc')
    expect(result.tags.tenantSlug).toBe('alpha')
    expect(result.tags.requestId).toBe('req-123')
    expect(result.tags.role).toBe('ADMIN')
    expect(result.tags.tenantRole).toBe('OWNER')
    expect(result.user.id).toBe('u-1')
    expect(result.user.email).toBe('u1@example.com')
    expect(result.user.username).toBe('User One')
  })

  it('is a no-op when tenantContext is absent', async () => {
    const baseEvent: any = { level: 'error', message: 'boom', tags: {}, user: {} }
    const result = (capturedProcessor as any)(structuredClone(baseEvent))
    expect(result.tags.tenantId).toBeUndefined()
    expect(result.user.id).toBeUndefined()
  })
})

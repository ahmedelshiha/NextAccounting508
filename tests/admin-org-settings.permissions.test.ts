import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/permissions', () => ({
  hasPermission: vi.fn((role: string, perm: string) => {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true
    return false
  }),
  PERMISSIONS: {
    ORG_SETTINGS_VIEW: 'org.settings.view',
    ORG_SETTINGS_EDIT: 'org.settings.edit'
  }
}))

// Minimal prisma mock to avoid DB calls when unauthorized
const prismaMock = {
  organizationSettings: {
    findFirst: vi.fn(async () => null),
    create: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
  }
}
vi.mock('@/lib/prisma', () => ({ default: prismaMock }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => ({ ok: true })) }))

const base = 'https://t1.example.com'

describe('admin/org-settings API permissions', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('GET returns 401 when unauthenticated', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => null) }))
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => null) }))
    const mod = await import('@/app/api/admin/org-settings/route')
    const res: any = await mod.GET(new Request(`${base}/api/admin/org-settings`))
    expect(res.status).toBe(401)
  })

  it('PUT returns 401 when role lacks ORG_SETTINGS_EDIT', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u1', role: 'TEAM_MEMBER' } })) }))
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u1', role: 'TEAM_MEMBER', tenantId: 'test-tenant' } })) }))
    const mod = await import('@/app/api/admin/org-settings/route')
    const payload = { general: { name: 'Acme' } }
    const res: any = await mod.PUT(new Request(`${base}/api/admin/org-settings`, { method: 'PUT', body: JSON.stringify(payload) }))
    expect(res.status).toBe(401)
  })
})

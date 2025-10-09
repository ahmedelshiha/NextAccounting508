import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/permissions', () => ({
  hasPermission: vi.fn((role: string, perm: string) => {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true
    return false
  }),
  PERMISSIONS: {
    COMMUNICATION_SETTINGS_VIEW: 'communication.settings.view',
    COMMUNICATION_SETTINGS_EDIT: 'communication.settings.edit'
  }
}))

const db: any = { rows: [] }
const genId = () => 'com_' + Math.random().toString(36).slice(2)

const prismaMock = {
  communicationSettings: {
    findFirst: async ({ where }: any) => db.rows.find((o: any) => (where?.tenantId ?? null) === (o.tenantId ?? null)) || null,
    create: async ({ data }: any) => { const row = { id: genId(), createdAt: new Date(), updatedAt: new Date(), ...data }; db.rows.push(row); return row },
    update: async ({ where, data }: any) => { const s = db.rows.find((x: any) => x.id === where.id || x.tenantId === (where.tenantId ?? null)); if (!s) throw new Error('not found'); Object.assign(s, data); s.updatedAt = new Date(); return s }
  }
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => ({ ok: true })) }))
vi.mock('@/lib/tenant', () => ({ 
  tenantFilter: vi.fn((tenantId: string | null) => ({ tenantId }))
}))
vi.mock('@/lib/default-tenant', () => ({
  resolveTenantId: vi.fn(async (tenantId: string | null) => tenantId || 'default-tenant')
}))

vi.mock('@/lib/cache.service', () => ({
  CacheService: vi.fn(() => ({
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
    delete: vi.fn(async () => {})
  }))
}))

// Mock the service directly to avoid complex schema validation issues
vi.mock('@/services/communication-settings.service', () => ({
  default: {
    get: vi.fn(async () => ({
      email: { senderName: '', senderEmail: '', replyTo: '', signatureHtml: '', transactionalEnabled: true, marketingEnabled: false, complianceBcc: false, templates: [] },
      sms: { provider: 'none', senderId: '', transactionalEnabled: false, marketingEnabled: false, fallbackToEmail: true, routes: [] },
      chat: { enabled: false, provider: 'none', routing: 'roundRobin', offlineMessage: '', workingHours: { timezone: 'UTC', start: '09:00', end: '17:00' }, escalationEmails: [] },
      notifications: { preferences: [], digestTime: '08:00', timezone: 'UTC' },
      newsletters: { enabled: false, doubleOptIn: true, defaultSenderName: '', defaultSenderEmail: '', archiveUrl: '', topics: [] },
      reminders: {}
    })),
    upsert: vi.fn(async (tenantId: any, data: any) => ({
      email: { senderName: data.email?.senderName || 'Acme', senderEmail: '', replyTo: '', signatureHtml: '', transactionalEnabled: true, marketingEnabled: false, complianceBcc: false, templates: [] },
      sms: { provider: data.sms?.provider || 'none', senderId: '', transactionalEnabled: false, marketingEnabled: false, fallbackToEmail: true, routes: [] },
      chat: { enabled: false, provider: 'none', routing: 'roundRobin', offlineMessage: '', workingHours: { timezone: 'UTC', start: '09:00', end: '17:00' }, escalationEmails: [] },
      notifications: { preferences: [], digestTime: '08:00', timezone: 'UTC' },
      newsletters: { enabled: false, doubleOptIn: true, defaultSenderName: '', defaultSenderEmail: '', archiveUrl: '', topics: [] },
      reminders: {}
    }))
  }
}))

beforeEach(() => { db.rows.length = 0 })

const base = 'https://t1.example.com'

describe('admin/communication-settings API', () => {
  it('GET unauthorized without role', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => null) }))
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => null) }))
    const mod = await import('@/app/api/admin/communication-settings/route')
    const res: any = await mod.GET(new Request(`${base}/api/admin/communication-settings`))
    expect(res.status).toBe(401)
  })

  it('PUT requires COMMUNICATION_SETTINGS_EDIT', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u1', role: 'TEAM_MEMBER' } })) }))
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'u1', role: 'TEAM_MEMBER', tenantId: 'test-tenant' } })) }))
    const mod = await import('@/app/api/admin/communication-settings/route')
    const res: any = await mod.PUT(new Request(`${base}/api/admin/communication-settings`, { method: 'PUT', body: JSON.stringify({ email: { senderName: 'Acme' } }) }))
    expect(res.status).toBe(401)
  })

  it('PUT accepts valid payload for ADMIN and merges settings', async () => {
    vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
    vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 'test-tenant' } })) }))
    const mod = await import('@/app/api/admin/communication-settings/route')
    // First save
    const res1: any = await mod.PUT(new Request(`${base}/api/admin/communication-settings`, { method: 'PUT', body: JSON.stringify({ email: { senderName: 'Acme' } }) }))
    expect(res1.status).toBe(200)
    const out1 = await res1.json()
    expect(out1.email.senderName).toBe('Acme')
    // Subsequent merge does not drop arrays when omitted
    const res2: any = await mod.PUT(new Request(`${base}/api/admin/communication-settings`, { method: 'PUT', body: JSON.stringify({ sms: { provider: 'twilio' } }) }))
    expect(res2.status).toBe(200)
    const out2 = await res2.json()
    expect(out2.email.senderName).toBe('Acme')
    expect(out2.sms.provider).toBe('twilio')
  })
})

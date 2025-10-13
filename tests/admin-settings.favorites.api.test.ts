import { describe, it, expect, beforeEach, vi } from 'vitest'

// Minimal in-memory store
const db: any = { favorites: [] as any[] }
const now = () => new Date()

// Mock prisma.favoriteSetting CRUD
vi.mock('@/lib/prisma', () => ({
  default: {
    favoriteSetting: {
      findMany: vi.fn(async ({ where }: any) => {
        return db.favorites
          .filter((f) => f.tenantId === where?.where?.tenantId || f.tenantId === where?.tenantId)
          .filter((f) => f.userId === where?.where?.userId || f.userId === where?.userId)
          .sort((a, b) => (b.createdAt as any) - (a.createdAt as any))
      }),
      upsert: vi.fn(async ({ where, update, create }: any) => {
        const key = where?.tenantId_userId_settingKey || where
        const idx = db.favorites.findIndex(
          (f: any) => f.tenantId === key.tenantId && f.userId === key.userId && f.settingKey === key.settingKey,
        )
        if (idx >= 0) {
          db.favorites[idx] = { ...db.favorites[idx], ...update, updatedAt: now() }
          return { ...db.favorites[idx] }
        }
        const row = { id: 'fav_' + Math.random().toString(36).slice(2), createdAt: now(), updatedAt: now(), ...create }
        db.favorites.push(row)
        return { ...row }
      }),
      delete: vi.fn(async ({ where }: any) => {
        const key = where?.tenantId_userId_settingKey || where
        const idx = db.favorites.findIndex(
          (f: any) => f.tenantId === key.tenantId && f.userId === key.userId && f.settingKey === key.settingKey,
        )
        if (idx >= 0) db.favorites.splice(idx, 1)
        return { ok: true }
      }),
    },
  },
}))

// Mock auth and tenant context
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 'tenant1', tenantRole: 'OWNER' } })),
}))
vi.mock('@/lib/tenant-utils', () => ({
  requireTenantContext: vi.fn(() => ({ tenantId: 'tenant1', userId: 'admin1', role: 'ADMIN' })),
}))

const base = 'https://t.example.com'

describe('admin/settings/favorites API', () => {
  beforeEach(() => {
    db.favorites.length = 0
  })

  it('GET returns empty list initially', async () => {
    const mod = await import('@/app/api/admin/settings/favorites/route')
    const res: any = await mod.GET(new Request(`${base}/api/admin/settings/favorites`))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBe(0)
  })

  it('POST validates payload (400)', async () => {
    const mod = await import('@/app/api/admin/settings/favorites/route')
    const res: any = await mod.POST(new Request(`${base}/api/admin/settings/favorites`, { method: 'POST', body: JSON.stringify({}) }))
    expect(res.status).toBe(400)
  })

  it('POST creates favorite and GET lists it; DELETE removes it', async () => {
    const mod = await import('@/app/api/admin/settings/favorites/route')
    const payload = { settingKey: 'security', route: '/admin/settings/security', label: 'Security & Compliance' }
    const add: any = await mod.POST(new Request(`${base}/api/admin/settings/favorites`, { method: 'POST', body: JSON.stringify(payload) }))
    expect(add.status).toBe(200)
    const added = await add.json()
    expect(added.ok).toBe(true)
    expect(added.data.settingKey).toBe('security')

    const list: any = await mod.GET(new Request(`${base}/api/admin/settings/favorites`))
    const listed = await list.json()
    expect(listed.data.length).toBe(1)

    const del: any = await mod.DELETE(new Request(`${base}/api/admin/settings/favorites?settingKey=security`, { method: 'DELETE' }))
    expect(del.status).toBe(200)

    const list2: any = await mod.GET(new Request(`${base}/api/admin/settings/favorites`))
    const listed2 = await list2.json()
    expect(listed2.data.length).toBe(0)
  })
})

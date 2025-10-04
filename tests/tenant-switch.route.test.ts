import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { getServerSession } from 'next-auth'

vi.mock('@/lib/auth', () => ({
  authOptions: {
    cookies: {
      sessionToken: { name: 'next-auth.session-token' },
    },
  },
}))

const db = {
  users: [] as Array<{
    id: string
    name: string | null
    email: string | null
    image: string | null
    role: string | null
    sessionVersion: number | null
  }>,
  memberships: [] as Array<{
    userId: string
    tenantId: string
    role: string | null
    tenant: { slug: string | null; name: string | null } | null
  }>,
}

const prismaMock = {
  tenantMembership: {
    findFirst: vi.fn(async ({ where }: { where: { userId: string; tenantId: string } }) =>
      db.memberships.find((m) => m.userId === where.userId && m.tenantId === where.tenantId) ?? null
    ),
    findMany: vi.fn(async ({ where }: { where: { userId: string } }) =>
      db.memberships.filter((m) => m.userId === where.userId)
    ),
  },
  user: {
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
      db.users.find((u) => u.id === where.id) ?? null
    ),
  },
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))

let POST: (request: Request) => Promise<Response>

beforeAll(async () => {
  const mod = await import('@/app/api/tenant/switch/route')
  POST = mod.POST as unknown as (request: Request) => Promise<Response>
})

beforeEach(() => {
  db.users.splice(0, db.users.length, {
    id: 'user-1',
    name: 'Tenant Admin',
    email: 'admin@example.com',
    image: null,
    role: 'ADMIN',
    sessionVersion: 4,
  })
  db.memberships.splice(0, db.memberships.length)
  process.env.NEXTAUTH_SECRET = 'unit-test-secret'
  prismaMock.tenantMembership.findFirst.mockClear()
  prismaMock.tenantMembership.findMany.mockClear()
  prismaMock.user.findUnique.mockClear()
  vi.mocked(getServerSession).mockResolvedValue({
    user: {
      id: 'user-1',
      role: 'ADMIN',
      tenantId: 'tenant-alpha',
      tenantSlug: 'tenant-alpha',
      tenantRole: 'OWNER',
    },
  } as any)
})

function createRequest(body?: unknown) {
  const init: RequestInit = { method: 'POST', body: body ? JSON.stringify(body) : undefined }
  const request = new Request('https://app.local/api/tenant/switch', init)
  ;(request as any).cookies = {
    get: vi.fn(() => undefined),
  }
  return request as any
}

describe('POST /api/tenant/switch', () => {
  it('returns 400 when tenantId is missing', async () => {
    const request = createRequest({})
    const response = await POST(request)
    expect(response.status).toBe(400)
    const payload = await response.json()
    expect(payload.error).toBe('tenantId required')
    expect(response.headers.get('Set-Cookie')).toBeNull()
  })

  it('returns 403 when membership is not found', async () => {
    const request = createRequest({ tenantId: 'tenant-beta' })
    const response = await POST(request)
    expect(prismaMock.tenantMembership.findFirst).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Forbidden' })
  })

  it('issues updated session cookie when membership exists', async () => {
    db.memberships.push(
      {
        userId: 'user-1',
        tenantId: 'tenant-alpha',
        role: 'OWNER',
        tenant: { slug: 'tenant-alpha', name: 'Alpha Co' },
      },
      {
        userId: 'user-1',
        tenantId: 'tenant-beta',
        role: 'ADMIN',
        tenant: { slug: 'tenant-beta', name: 'Beta Co' },
      }
    )

    const request = createRequest({ tenantId: 'tenant-beta' })
    const response = await POST(request)

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload).toEqual({ success: true })

    const cookie = response.headers.get('Set-Cookie')
    expect(cookie).toBeTruthy()
    expect(cookie).toContain('next-auth.session-token=')
    expect(cookie).toContain('HttpOnly')

    const tokenValue = cookie!.split(';')[0].split('=')[1]
    const { decode } = await import('next-auth/jwt')
    const decoded = await decode({ token: tokenValue, secret: process.env.NEXTAUTH_SECRET! })

    expect(decoded?.tenantId).toBe('tenant-beta')
    expect(decoded?.tenantRole).toBe('ADMIN')
    expect(Array.isArray(decoded?.availableTenants)).toBe(true)
    expect(decoded?.availableTenants?.length).toBe(2)
    expect(decoded?.sessionVersion).toBe(4)
  })
})

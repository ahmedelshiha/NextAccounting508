import { describe, it, expect, vi } from 'vitest'

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/permissions', () => ({ hasPermission: () => true, PERMISSIONS: {} }))

vi.mock('@/services/services.service', () => ({
  ServicesService: class {
    async getServiceVersionHistory(id: string) { return [] }
  }
}))

describe('api/admin/services/[id]/versions route', () => {
  it('returns version history (empty array)', async () => {
    const { GET }: any = await import('@/app/api/admin/services/[id]/versions/route')
    const res: any = await GET(new Request('https://x'), { params: Promise.resolve({ id: 's1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.versions)).toBe(true)
  })
})

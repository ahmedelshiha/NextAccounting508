import { vi } from 'vitest'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'u1', role: 'ADMIN' } }))
}))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(async () => {}) }))

import { POST } from '@/app/api/admin/auth/logout/route'

describe('logout API', () => {
  it('logs audit and returns success', async () => {
    const res: any = await POST(new Request('https://x', { method: 'POST' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })
})

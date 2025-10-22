import { describe, it, expect, vi } from 'vitest'

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/permissions', () => ({ hasPermission: () => true, PERMISSIONS: {} }))

// Mock the ServicesService used by the route
const cloneSpy = vi.fn(async (name: string, fromId: string) => ({ id: 's9', name, slug: 'cloned', active: false, status: 'DRAFT' }))
const getByIdSpy = vi.fn(async (_tenant: any, id: string) => (id === 's1' ? { id: 's1', name: 'Tax Filing' } : null))
vi.mock('@/services/services.service', () => ({
  ServicesService: class {
    async getServiceById(t: any, id: string) { return getByIdSpy(t, id) }
    async cloneService(name: string, fromId: string) { return cloneSpy(name, fromId) }
  }
}))

// Ensure services bootstrap for consistent find/count behavior
import setupServices from '../setup/services.setup'
setupServices()

describe('api/admin/services/[id]/clone route', () => {
  it('clones a service and returns 201', async () => {
    const { POST }: any = await import('@/app/api/admin/services/[id]/clone/route')
    const req = new Request('https://x', { method: 'POST', body: JSON.stringify({ name: 'My Clone' }) })
    const res: any = await POST(req, { params: Promise.resolve({ id: 's1' }) })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.service?.id).toBe('s9')
    expect(cloneSpy).toHaveBeenCalledWith('My Clone', 's1')
  })

  it('uses default name when none provided', async () => {
    const { POST }: any = await import('@/app/api/admin/services/[id]/clone/route')
    const res: any = await POST(new Request('https://x', { method: 'POST' }), { params: Promise.resolve({ id: 's1' }) })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.service).toBeTruthy()
    expect(getByIdSpy).toHaveBeenCalled()
  })
})

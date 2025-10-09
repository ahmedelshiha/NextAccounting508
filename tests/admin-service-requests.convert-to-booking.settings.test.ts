vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('next-auth/next', () => ({ 
  getServerSession: vi.fn(async () => ({ 
    user: { 
      id: 'admin1', 
      role: 'ADMIN', 
      tenantId: 'tenant1',
      tenantRole: 'ADMIN'
    } 
  })) 
}))

// Mock tenant context and permissions
vi.mock('@/lib/tenant-utils', () => ({
  requireTenantContext: vi.fn(() => ({
    tenantId: 'tenant1',
    userId: 'admin1',
    role: 'ADMIN'
  })),
  getTenantFilter: vi.fn(() => ({ tenantId: 'tenant1' }))
}))

vi.mock('@/lib/permissions', () => ({
  hasPermission: vi.fn(() => true),
  PERMISSIONS: {
    SERVICE_REQUESTS_UPDATE: 'service_requests.update'
  }
}))

// Mock tenant cookie verification
vi.mock('@/lib/tenant-cookie', () => ({
  verifyTenantCookie: vi.fn(() => true)
}))

// Mock services settings - this will be overridden in individual tests
const mockServicesSettings = {
  get: vi.fn(async () => ({ serviceRequests: { allowConvertToBooking: true } }))
}
vi.mock('@/services/services-settings.service', () => ({
  default: mockServicesSettings,
  DEFAULT_SERVICES_SETTINGS: { serviceRequests: { allowConvertToBooking: true } }
}))

// Minimal prisma mock
const db: any = {
  req: { id: 'r1', status: 'APPROVED', isBooking: false, clientId: 'c1', serviceId: 's1', description: 'desc', clientName: 'Acme', clientEmail: 'a@x.com', clientPhone: null, assignedTeamMemberId: null, tenantId: 'tenant1', service: { duration: 60, category: 'general', name: 'Service' } },
}
vi.mock('@/lib/prisma', () => ({
  default: {
    serviceRequest: {
      findUnique: vi.fn(async ({ where }: any) => (where?.id === db.req.id ? { ...db.req } : null)),
      findFirst: vi.fn(async ({ where, include }: any) => {
        // Check if record matches where clauses (id and tenant filter)
        if (where?.id !== db.req.id) return null
        if (where?.tenantId && where.tenantId !== db.req.tenantId) return null
        
        const base = { ...db.req }
        const withInclude: any = { ...base }
        if (include?.client) withInclude.client = { id: 'c1', name: base.clientName || 'Acme', email: base.clientEmail || 'a@x.com' }
        if (include?.service) withInclude.service = base.service || { id: 's1', name: 'Service', duration: 60, price: 0, category: 'general' }
        if (include?.assignedTeamMember) withInclude.assignedTeamMember = base.assignedTeamMemberId ? { id: base.assignedTeamMemberId, name: 'TM', email: 'tm@example.com' } : null
        return withInclude
      }),
      update: vi.fn(async ({ where, data }: any) => { if (where?.id !== db.req.id) throw new Error('not found'); db.req = { ...db.req, ...data }; return { ...db.req } }),
    },
    booking: {
      create: vi.fn(async ({ data }: any) => ({ id: 'b1', ...data, status: 'PENDING', scheduledAt: new Date(), duration: data.duration || 60 })),
    },
    serviceRequestComment: {
      create: vi.fn(async () => ({ id: 'c1' })),
    },
  },
}))

const base = 'https://t1.example.com'

describe('convert-to-booking respects allowConvertToBooking setting', () => {
  beforeEach(() => { db.req = { id: 'r1', status: 'APPROVED', isBooking: false, clientId: 'c1', serviceId: 's1', description: 'desc', clientName: 'Acme', clientEmail: 'a@x.com', clientPhone: null, assignedTeamMemberId: null, tenantId: 'tenant1', service: { duration: 60, category: 'general', name: 'Service' } } })

  it('returns 403 when disabled in settings', async () => {
    // Override the settings mock to return false
    mockServicesSettings.get.mockResolvedValueOnce({ serviceRequests: { allowConvertToBooking: false } })
    
    const mod = await import('@/app/api/admin/service-requests/[id]/convert-to-booking/route')
    const res: any = await mod.POST(new Request(`${base}/api/admin/service-requests/${db.req.id}/convert-to-booking`, { method: 'POST', body: JSON.stringify({}) }), { params: Promise.resolve({ id: db.req.id }) })
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toMatch(/disabled/i)
  })

  it('creates booking when enabled in settings', async () => {
    // Override the settings mock to return true
    mockServicesSettings.get.mockResolvedValueOnce({ serviceRequests: { allowConvertToBooking: true } })
    
    const mod = await import('@/app/api/admin/service-requests/[id]/convert-to-booking/route')
    const res: any = await mod.POST(new Request(`${base}/api/admin/service-requests/${db.req.id}/convert-to-booking`, { method: 'POST', body: JSON.stringify({}) }), { params: Promise.resolve({ id: db.req.id }) })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.bookingId).toBeDefined()
  })
})

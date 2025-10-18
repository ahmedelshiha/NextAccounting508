import { vi, describe, it, expect } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/permissions', () => ({ hasPermission: () => true, PERMISSIONS: { TEAM_VIEW: 'TEAM_VIEW' } }))

process.env.NETLIFY_DATABASE_URL = ''

// Ensure team management mocks applied
import setupTeamManagement from './setup/teamManagement.setup'
setupTeamManagement()

describe('api/admin/team-management routes (fallback)', () => {
  it('availability returns empty data when DB not configured', async () => {
    const { GET }: any = await import('@/app/api/admin/team-management/availability/route')
    const res: any = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.data)).toBe(true)
  })

  it('workload returns default structure when DB not configured', async () => {
    const { GET }: any = await import('@/app/api/admin/team-management/workload/route')
    const res: any = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
    expect(typeof json.data.utilization).toBe('number')
    expect(Array.isArray(json.data.distribution)).toBe(true)
  })

  it('skills returns empty when DB not configured', async () => {
    const { GET }: any = await import('@/app/api/admin/team-management/skills/route')
    const res: any = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.data)).toBe(true)
  })

  it('assignments returns empty when DB not configured', async () => {
    const { GET }: any = await import('@/app/api/admin/team-management/assignments/route')
    const res: any = await GET(new Request('https://x'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.data)).toBe(true)
  })
})

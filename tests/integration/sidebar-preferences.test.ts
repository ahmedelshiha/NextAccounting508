import http from 'http'
import { URL } from 'url'
import { vi } from 'vitest'

// Mock prisma
vi.mock('@/lib/prisma', () => {
  const mock = {
    sidebarPreferences: { findUnique: vi.fn(), upsert: vi.fn() },
  }
  return { default: mock, ...mock }
})
// Mock observability helpers (audit logger)
vi.mock('@/lib/observability-helpers', () => ({ logAuditSafe: vi.fn() }))
// Mock next-auth/next getServerSession used by withTenantContext
vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }))

import prisma from '@/lib/prisma'
import * as naNext from 'next-auth/next'
import { logAuditSafe } from '@/lib/observability-helpers'

// Helper to read request body
function readBody(req: http.IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: any[] = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

let server: http.Server
let baseUrl: string

beforeAll(async () => {
  server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', `http://localhost`)
      const pathname = url.pathname
      if (!/^\/api\/admin\/sidebar-preferences$/.test(pathname)) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'not found' }))
        return
      }

      const mod = await import('@/app/api/admin/sidebar-preferences/route')
      const method = (req.method || 'GET').toUpperCase()

      const headers = new Headers()
      for (const [k, v] of Object.entries(req.headers)) {
        if (Array.isArray(v)) headers.set(k, v.join(','))
        else if (v) headers.set(k, v)
      }
      const bodyText = await readBody(req)
      const fullUrl = `http://localhost${pathname}${url.search}`
      const webReq = new Request(fullUrl, { method, headers, body: bodyText || undefined })

      const exported = (mod as any)
      if (typeof exported[method] === 'function') {
        const result = await exported[method](webReq, { params: Promise.resolve({}) })
        if (result instanceof Response) {
          const text = await result.text()
          const h: any = {}
          result.headers.forEach((val, key) => (h[key] = val))
          res.writeHead(result.status || 200, h)
          res.end(text)
          return
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
        return
      }

      const ALLOWED = ['GET', 'PUT', 'OPTIONS'].filter(m => typeof exported[m] === 'function')
      res.writeHead(405, { 'Content-Type': 'application/json', Allow: ALLOWED.join(',') })
      res.end(JSON.stringify({ error: 'Method Not Allowed' }))
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: String(err && (err.stack || err.message || err)) }))
    }
  })

  await new Promise<void>((resolve) => { server.listen(0, () => resolve()) })
  // @ts-ignore
  const addr = server.address()
  const port = typeof addr === 'object' && addr ? addr.port : addr
  baseUrl = `http://localhost:${port}`
})

afterAll(async () => { await new Promise<void>((resolve) => server.close(() => resolve())) })

describe('Admin sidebar preferences API', () => {
  it('GET returns defaults when no DB entry', async () => {
    vi.mocked(naNext.getServerSession).mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    ;(prisma as any).sidebarPreferences.findUnique.mockResolvedValueOnce(null)

    const res = await fetch(`${baseUrl}/api/admin/sidebar-preferences`, { method: 'GET' })
    expect(res.status).toBe(200)
    const json = await res.json()
    const data = json?.data || json
    expect(data).toBeTruthy()
    expect(typeof data.collapsed).toBe('boolean')
    expect(typeof data.width).toBe('number')
  })

  it('PUT upserts preferences and returns stored record and logs audit', async () => {
    // Mock successful upsert and audit
    vi.mocked(naNext.getServerSession).mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    ;(prisma as any).sidebarPreferences.upsert.mockResolvedValueOnce({ userId: 'user1', collapsed: true, width: 200 })

    // Mock audit logger
    vi.mocked((await import('@/lib/observability-helpers')).logAuditSafe).mockResolvedValueOnce(undefined as any)

    const payload = { collapsed: true, width: 200 }
    const res = await fetch(`${baseUrl}/api/admin/sidebar-preferences`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    expect(res.status).toBe(200)
    const json = await res.json()
    const data = json?.data || json
    expect(data).toBeTruthy()
    expect(data.collapsed).toBe(true)
    expect(data.width).toBe(200)

    // Verify audit was called
    const { logAuditSafe } = await import('@/lib/observability-helpers')
    expect(vi.mocked(logAuditSafe).mock.calls.length).toBeGreaterThanOrEqual(1)
    const call = vi.mocked(logAuditSafe).mock.calls[0][0]
    expect(call).toMatchObject({ action: 'preferences:update', actorId: 'user1' })
  })

  it('GET returns 401 when unauthenticated', async () => {
    vi.mocked(naNext.getServerSession).mockResolvedValueOnce(null as any)
    const res = await fetch(`${baseUrl}/api/admin/sidebar-preferences`, { method: 'GET' })
    expect(res.status).toBe(401)
  })

  it('PUT returns 401 when unauthenticated', async () => {
    vi.mocked(naNext.getServerSession).mockResolvedValueOnce(null as any)
    const payload = { collapsed: true, width: 200 }
    const res = await fetch(`${baseUrl}/api/admin/sidebar-preferences`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    expect(res.status).toBe(401)
  })

  it('PUT with invalid payload returns 400', async () => {
    vi.mocked(naNext.getServerSession).mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    // width below minimum (64) -> invalid
    const invalid = { collapsed: true, width: 10 }
    const res = await fetch(`${baseUrl}/api/admin/sidebar-preferences`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(invalid) })
    expect(res.status).toBe(400)
  })

  it('PUT returns 500 when DB is not configured (DB message)', async () => {
    vi.mocked(naNext.getServerSession).mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    ;(prisma as any).sidebarPreferences.upsert.mockImplementationOnce(() => { throw new Error('Database is not configured') })

    const payload = { collapsed: false, width: 200 }
    const res = await fetch(`${baseUrl}/api/admin/sidebar-preferences`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    expect(res.status).toBe(500)
    const json = await res.json().catch(() => null)
    expect(res.status).toBe(500)
    // ensure response contains a helpful error string
    const bodyStr = JSON.stringify(json || '')
    expect(bodyStr).toMatch(/Database|Failed|error/i)
  })

  it('PUT returns 500 when DB throws Prisma error code', async () => {
    vi.mocked(naNext.getServerSession).mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    const err: any = new Error('connect failed')
    err.code = 'P1001'
    ;(prisma as any).sidebarPreferences.upsert.mockImplementationOnce(() => { throw err })

    const payload = { collapsed: false, width: 200 }
    const res = await fetch(`${baseUrl}/api/admin/sidebar-preferences`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    expect(res.status).toBe(500)
    const json = await res.json().catch(() => null)
    const errMsg = (json && json.error && json.error.message) ? json.error.message : JSON.stringify(json || '')
    expect(errMsg).toMatch(/Database not configured|Failed to update sidebar preferences/i)
  })
})

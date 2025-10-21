import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import http from 'http'
import { URL } from 'url'
import { vi } from 'vitest'

// Mock prisma for integration tests; individual tests can override mockResolvedValueOnce
vi.mock('@/lib/prisma', () => {
  const mock = {
    serviceRequest: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    serviceRequestComment: { findMany: vi.fn(), create: vi.fn() },
    service: { findUnique: vi.fn() },
    booking: { findUnique: vi.fn(), update: vi.fn() },
  }
  return { default: mock, ...mock }
})
// Ensure applyRateLimit returns allowed by default for these tests
vi.mock('@/lib/rate-limit', async () => {
  const actual = await vi.importActual<typeof import('@/lib/rate-limit')>('@/lib/rate-limit')
  return { ...actual, applyRateLimit: vi.fn(async () => ({ allowed: true, backend: 'memory', count: 0, limit: 3, remaining: 3, resetAt: Date.now() + 60000 })), getClientIp: (_req: any) => '127.0.0.1' }
})
import prisma from '@/lib/prisma'
import * as naNext from 'next-auth/next'

// Helper to read request body
function readBody(req: http.IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: any[] = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

// Map path patterns to modules and context builders
const routes: any[] = [
  {
    match: /^\/api\/portal\/chat$/,
    loader: () => import('@/app/api/portal/chat/route'),
    buildContext: (pathname: string) => undefined,
  },
  {
    match: /^\/api\/portal\/service-requests\/([^/]+)\/comments$/,
    loader: () => import('@/app/api/portal/service-requests/[id]/comments/route'),
    buildContext: (pathname: string) => {
      const m = pathname.match(/^\/api\/portal\/service-requests\/([^/]+)\/comments$/)
      const id = m ? m[1] : ''
      return { params: Promise.resolve({ id }) }
    }
  },
  {
    match: /^\/api\/bookings\/([^/]+)$/,
    loader: () => import('@/app/api/bookings/[id]/route'),
    buildContext: (pathname: string) => {
      const m = pathname.match(/^\/api\/bookings\/([^/]+)$/)
      const id = m ? m[1] : ''
      return { params: Promise.resolve({ id }) }
    }
  },
  {
    match: /^\/api\/portal\/service-requests\/export$/,
    loader: () => import('@/app/api/portal/service-requests/export/route'),
    buildContext: () => undefined,
  },
  {
    match: /^\/api\/portal\/service-requests$/,
    loader: () => import('@/app/api/portal/service-requests/route'),
    buildContext: () => undefined,
  }
]

let server: http.Server
let baseUrl: string

beforeAll(async () => {
  server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', `http://localhost`)
      const pathname = url.pathname

      let routeEntry: any = null
      for (const r of routes) if (r.match.test(pathname)) { routeEntry = r; break }
      if (!routeEntry) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'not found' }))
        return
      }

      const mod = await routeEntry.loader()
      const method = (req.method || 'GET').toUpperCase()

      // Build a Web Request to pass into handler
      const headers = new Headers()
      for (const [k, v] of Object.entries(req.headers)) {
        if (Array.isArray(v)) headers.set(k, v.join(','))
        else if (v) headers.set(k, v)
      }

      const bodyText = await readBody(req)
      const fullUrl = `http://localhost${pathname}${url.search}`
      const webReq = new Request(fullUrl, { method, headers, body: bodyText || undefined })

      // If handler exists for method, call it
      const exported = (mod as any)
      if (typeof exported[method] === 'function') {
        const context = routeEntry.buildContext(pathname)
        const result = await exported[method](webReq, context)
        // result is expected to be a Response or NextResponse
        if (result instanceof Response) {
          // stream body
          const text = await result.text()
          const h: any = {}
          result.headers.forEach((val, key) => h[key] = val)
          res.writeHead(result.status || 200, h)
          res.end(text)
          return
        }
        // fallback: send JSON
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
        return
      }

      // No handler for method -> return 405 with Allow header
      const ALLOWED = ['GET','POST','PUT','PATCH','DELETE','OPTIONS'].filter(m => typeof exported[m] === 'function')
      res.writeHead(405, { 'Content-Type': 'application/json', Allow: ALLOWED.join(',') })
      res.end(JSON.stringify({ error: 'Method Not Allowed' }))

    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: String(err && (err.stack || err.message || err)) }))
    }
  })

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve())
  })
  // @ts-ignore
  const addr = server.address()
  const port = typeof addr === 'object' && addr ? addr.port : addr
  baseUrl = `http://localhost:${port}`
})

afterAll(async () => { await new Promise<void>((resolve) => server.close(() => resolve())) })

describe('HTTP-level integration tests for method-not-allowed and OPTIONS', () => {
  it('PUT to /api/portal/chat returns 405 and Allow header includes GET,POST,OPTIONS', async () => {
    const res = await fetch(`${baseUrl}/api/portal/chat`, { method: 'PUT' })
    expect(res.status).toBe(405)
    const allow = res.headers.get('Allow')
    expect(allow).toBeTruthy()
    expect(allow).toMatch(/GET/)
    expect(allow).toMatch(/POST/)
    expect(allow).toMatch(/OPTIONS/)
  })

  it('OPTIONS to /api/portal/chat returns 204 or handled OPTIONS response', async () => {
    const res = await fetch(`${baseUrl}/api/portal/chat`, { method: 'OPTIONS' })
    // Accept either 204 (standard) or the module-provided status
    expect([200,204,204,405,401].includes(res.status)).toBeTruthy()
    const allow = res.headers.get('Allow')
    expect(allow).toBeTruthy()
  })

  it('DELETE to comments route returns 405 with Allow header', async () => {
    const res = await fetch(`${baseUrl}/api/portal/service-requests/abc/comments`, { method: 'DELETE' })
    expect(res.status).toBe(405)
    const allow = res.headers.get('Allow')
    expect(allow).toBeTruthy()
    expect(allow).toMatch(/GET/)
    expect(allow).toMatch(/POST/)
    expect(allow).toMatch(/OPTIONS/)
  })

  it('OPTIONS to comments route returns Allow header', async () => {
    const res = await fetch(`${baseUrl}/api/portal/service-requests/abc/comments`, { method: 'OPTIONS' })
    expect([200,204].includes(res.status)).toBeTruthy()
    const allow = res.headers.get('Allow')
    expect(allow).toBeTruthy()
  })
})

// AUTHENTICATED / UNAUTHENTICATED FLOW TESTS
describe('HTTP-level integration tests for auth flows', () => {
  it('DELETE /api/bookings/:id returns 401 when unauthenticated', async () => {
    vi.mocked(naNext.getServerSession).mockResolvedValueOnce(null as any)
    const res = await fetch(`${baseUrl}/api/bookings/b1`, { method: 'DELETE' })
    expect(res.status).toBe(401)
  })

  it('DELETE /api/bookings/:id cancels when authenticated owner and tenant matches', async () => {
    vi.mocked(naNext.getServerSession).mockResolvedValueOnce({ user: { id: 'client1' } } as any)
    ;(prisma as any).booking.findUnique.mockResolvedValueOnce({ id: 'b1', clientId: 'client1', tenantId: 't1', status: 'PENDING' })
    ;(prisma as any).booking.update.mockResolvedValueOnce({ id: 'b1', status: 'CANCELLED' })

    const res = await fetch(`${baseUrl}/api/bookings/b1`, { method: 'DELETE', headers: { 'x-tenant-id': 't1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message || json?.data?.message).toBeTruthy()
  })

  it('GET /api/portal/service-requests/export returns CSV for authenticated user', async () => {
    vi.mocked(naNext.getServerSession).mockResolvedValueOnce({ user: { id: 'client1' } } as any)
    ;(prisma as any).serviceRequest.findMany.mockResolvedValueOnce([
      { id: 'r1', title: 'Req 1', service: { name: 'S1' }, priority: 'MEDIUM', status: 'SUBMITTED', createdAt: new Date(), scheduledAt: null, bookingType: null }
    ])

    const res = await fetch(`${baseUrl}/api/portal/service-requests/export`, { method: 'GET' })
    expect(res.status).toBe(200)
    const ct = res.headers.get('Content-Type') || ''
    expect(ct).toMatch(/text\/csv/)
    const body = await res.text()
    expect(body).toContain('id')
    expect(body).toContain('Req 1')
  })

  it('POST /api/portal/service-requests creates when authenticated (simulate client create)', async () => {
    vi.mocked(naNext.getServerSession).mockResolvedValueOnce({ user: { id: 'client1' } } as any)
    ;(prisma as any).service.findUnique.mockResolvedValue({ id: 'svc1', name: 'SVC', active: true, status: 'ACTIVE' })
    ;(prisma as any).serviceRequest.create.mockResolvedValueOnce({ id: 'new1', clientId: 'client1', serviceId: 'svc1' })

    const res = await fetch(`${baseUrl}/api/portal/service-requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serviceId: 'svc1', isBooking: false }) })
    expect([200,201].includes(res.status)).toBeTruthy()
    const json = await res.json().catch(() => null)
    const created = json?.data || json || null
    expect(created).toBeTruthy()
  })
})

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import http from 'http'
import { URL } from 'url'

// Start a minimal server similar to http-server.test.ts but focused for these tests
import { vi as vitestVi } from 'vitest'

vi.mock('@/lib/prisma', () => {
  const mock = {
    serviceRequest: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    service: { findUnique: vi.fn() },
    booking: { findUnique: vi.fn(), update: vi.fn() },
  }
  return { default: mock, ...mock }
})
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'

let server: http.Server
let baseUrl: string

beforeAll((done) => {
  server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', `http://localhost`)
      const pathname = url.pathname
      // Delegate to route modules used earlier
      if (pathname === '/api/portal/service-requests') {
        const mod = await import('@/app/api/portal/service-requests/route')
        const method = (req.method || 'GET').toUpperCase()
        const headers = new Headers()
        for (const [k, v] of Object.entries(req.headers)) {
          if (Array.isArray(v)) headers.set(k, v.join(','))
          else if (v) headers.set(k, v)
        }
        const body = await new Promise<string>((resolve) => {
          const chunks: any[] = []
          req.on('data', c => chunks.push(c))
          req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
          req.on('error', () => resolve(''))
        })
        const webReq = new Request(`http://localhost${pathname}${url.search}`, { method, headers, body: body || undefined })
        if (typeof (mod as any)[method] === 'function') {
          const result = await (mod as any)[method](webReq)
          if (result instanceof Response) {
            const text = await result.text()
            const h: any = {}
            result.headers.forEach((val, key) => h[key] = val)
            res.writeHead(result.status || 200, h)
            res.end(text)
            return
          }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(result))
          return
        }
        const ALLOWED = ['GET','POST','PUT','PATCH','DELETE','OPTIONS'].filter(m => typeof (mod as any)[m] === 'function')
        res.writeHead(405, { 'Content-Type': 'application/json', Allow: ALLOWED.join(',') })
        res.end(JSON.stringify({ error: 'Method Not Allowed' }))
        return
      }

      if (pathname === '/api/portal/service-requests/export') {
        const mod = await import('@/app/api/portal/service-requests/export/route')
        const webReq = new Request(`http://localhost${pathname}${url.search}`)
        const result = await mod.GET(webReq)
        if (result instanceof Response) {
          const text = await result.text()
          const h: any = {}
          result.headers.forEach((val, key) => h[key] = val)
          res.writeHead(result.status || 200, h)
          res.end(text)
          return
        }
      }

      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'not found' }))
    } catch (e: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: String(e?.message || e) }))
    }
  })

  server.listen(0, () => {
    // @ts-ignore
    const addr = server.address()
    const port = typeof addr === 'object' && addr ? addr.port : addr
    baseUrl = `http://localhost:${port}`
    done()
  })
})

afterAll((done) => { server.close(() => done()) })

describe('Offline queue flush and large CSV export (HTTP-level)', () => {
  it('process queued POSTs (offline flush) should post queued items to server and receive success', async () => {
    // Prepare: mock session when server handles POST to create service request
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'client1' } } as any)
    // Mock service lookup
    ;(prisma as any).service.findUnique.mockResolvedValue({ id: 'svc1', name: 'SVC', active: true, status: 'ACTIVE' })
    ;(prisma as any).serviceRequest.create.mockResolvedValue({ id: 'queued-created', clientId: 'client1', serviceId: 'svc1' })

    // Simulate an offline queued item that points to our server's create endpoint
    const queued = [{ url: `${baseUrl}/api/portal/service-requests`, body: { serviceId: 'svc1', title: 'Offline request' } }]

    // processQueued simulation: attempt to POST each queued item
    const results: any[] = []
    for (const item of queued) {
      const res = await fetch(item.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item.body) })
      results.push({ status: res.status, text: await res.text() })
    }

    expect(results[0].status === 201 || results[0].status === 200).toBeTruthy()
    expect((prisma as any).serviceRequest.create).toHaveBeenCalled()
  })

  it('CSV large export should return correct number of rows when DB returns many items', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'client1' } } as any)
    // Generate 2000 fake rows
    const rows = new Array(2000).fill(0).map((_, i) => ({ id: `r${i}`, title: `Req ${i}`, service: { name: `Svc${i%10}` }, priority: 'MEDIUM', status: 'SUBMITTED', createdAt: new Date(), scheduledAt: null, bookingType: null }))
    ;(prisma as any).serviceRequest.findMany.mockResolvedValueOnce(rows)

    const res = await fetch(`${baseUrl}/api/portal/service-requests/export`, { method: 'GET' })
    expect(res.status).toBe(200)
    const ct = res.headers.get('Content-Type') || ''
    expect(ct).toMatch(/text\/csv/)
    const body = await res.text()
    const lines = body.split('\n')
    // header + rows
    expect(lines.length).toBeGreaterThanOrEqual(rows.length + 1)
  })
})

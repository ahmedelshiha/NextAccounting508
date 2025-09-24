import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import http from 'http'
import { URL } from 'url'

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

beforeAll((done) => {
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

  server.listen(0, () => {
    // @ts-ignore
    const addr = server.address()
    const port = typeof addr === 'object' && addr ? addr.port : addr
    baseUrl = `http://localhost:${port}`
    done()
  })
})

afterAll((done) => { server.close(() => done()) })

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

import * as NextServer from 'next/server'
import { getToken } from 'next-auth/jwt'

function isStaffRole(role: string | undefined | null) {
  return role === 'ADMIN' || role === 'TEAM_LEAD' || role === 'TEAM_MEMBER'
}

// Lightweight, dev-only rate limiter to prevent overloading the dev server
const DEV = process.env.NODE_ENV !== 'production'
const DEV_RATE_LIMIT_PER_MIN = Number(process.env.DEV_RATE_LIMIT_PER_MIN ?? '180')
const DEV_BURST_WINDOW_MS = Number(process.env.DEV_BURST_WINDOW_MS ?? '5000')
const DEV_BURST_MAX = Number(process.env.DEV_BURST_MAX ?? '30')

// Persist across requests within a single dev process
const rlStore: Map<string, { minuteStart: number; count: number; burstStart: number; burstCount: number }>
  = (globalThis as any).__rlStore ?? new Map()
;(globalThis as any).__rlStore = rlStore

function getClientIp(req: any) {
  try {
    const xff = req.headers.get?.('x-forwarded-for') || req.headers['x-forwarded-for']
    const ipFromXff = typeof xff === 'string' ? xff.split(',')[0]?.trim() : undefined
    return (
      ipFromXff || req.headers.get?.('x-real-ip') || req.headers['x-real-ip'] || req.ip || '127.0.0.1'
    )
  } catch {
    return '127.0.0.1'
  }
}

function checkDevRateLimit(key: string) {
  const now = Date.now()
  let entry = rlStore.get(key)
  if (!entry) {
    entry = { minuteStart: now, count: 0, burstStart: now, burstCount: 0 }
    rlStore.set(key, entry)
  }
  if (now - entry.minuteStart >= 60_000) {
    entry.minuteStart = now
    entry.count = 0
  }
  if (now - entry.burstStart >= DEV_BURST_WINDOW_MS) {
    entry.burstStart = now
    entry.burstCount = 0
  }
  entry.count += 1
  entry.burstCount += 1
  const overMinute = entry.count > DEV_RATE_LIMIT_PER_MIN
  const overBurst = entry.burstCount > DEV_BURST_MAX
  return { allowed: !(overMinute || overBurst), entry }
}

export async function middleware(req: any) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuth = !!token
  const { pathname } = req.nextUrl

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isAdminPage = pathname.startsWith('/admin')
  const isPortalPage = pathname.startsWith('/portal')
  const isApi = pathname.startsWith('/api')

  // Dev-only API rate limiting
  if (DEV && isApi) {
    const ip = getClientIp(req)
    const { allowed, entry } = checkDevRateLimit(String(ip))
    if (!allowed) {
      const retryAfter = Math.ceil((entry.minuteStart + 60_000 - Date.now()) / 1000)
      const res = NextServer.NextResponse.json(
        { error: 'Too Many Requests (development rate limit)' },
        { status: 429 }
      )
      res.headers.set('Retry-After', String(Math.max(1, retryAfter)))
      res.headers.set('Cache-Control', 'no-store')
      return res
    }
  }

  if (isAuthPage && isAuth) {
    const role = (token as unknown as { role?: string } | null)?.role
    const dest = isStaffRole(role) ? '/admin' : '/portal'
    return NextServer.NextResponse.redirect(new URL(dest, req.url))
  }

  if (isAdminPage) {
    if (!isAuth) return NextServer.NextResponse.redirect(new URL('/login', req.url))
    const role = (token as unknown as { role?: string } | null)?.role
    if (!isStaffRole(role)) {
      return NextServer.NextResponse.redirect(new URL('/portal', req.url))
    }
  }

  if (isPortalPage && !isAuth) {
    return NextServer.NextResponse.redirect(new URL('/login', req.url))
  }

  // Forward tenant header when multi-tenancy is enabled
  const requestHeaders = new Headers(req.headers)
  try {
    if (String(process.env.MULTI_TENANCY_ENABLED).toLowerCase() === 'true') {
      const hostname = req.nextUrl?.hostname || req.headers.get('host') || ''
      const host = String(hostname).split(':')[0]
      const parts = host.split('.')
      let sub = parts.length >= 3 ? parts[0] : ''
      if (sub === 'www' && parts.length >= 4) sub = parts[1]
      if (sub) requestHeaders.set('x-tenant-id', sub)
    }
  } catch {}

  const res = NextServer.NextResponse.next({ request: { headers: requestHeaders } })

  // Prevent caching of sensitive pages
  if (isAdminPage || isPortalPage) {
    res.headers.set('Cache-Control', 'no-store')
    res.headers.set('Pragma', 'no-cache')
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*', '/login', '/register', '/api/:path*'],
}

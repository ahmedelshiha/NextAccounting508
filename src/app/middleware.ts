import * as NextServer from 'next/server'
import { getToken } from 'next-auth/jwt'

function isStaffRole(role: string | undefined | null) {
  return role === 'ADMIN' || role === 'TEAM_LEAD' || role === 'TEAM_MEMBER'
}

export async function middleware(req: NextServer.NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuth = !!token
  const { pathname } = req.nextUrl

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isAdminPage = pathname.startsWith('/admin')
  const isPortalPage = pathname.startsWith('/portal')

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

    // Route-based RBAC enforcement
    try {
      const { hasPermission, PERMISSIONS } = await import('@/lib/permissions')
      const routePerm: Array<{ prefix: string; perm: keyof typeof PERMISSIONS }> = [
        { prefix: '/admin/services', perm: 'SERVICES_VIEW' },
        { prefix: '/admin/payments', perm: 'ANALYTICS_VIEW' },
        { prefix: '/admin/audits', perm: 'ANALYTICS_VIEW' },
        { prefix: '/admin/newsletter', perm: 'ANALYTICS_VIEW' },
        { prefix: '/admin/reports', perm: 'ANALYTICS_VIEW' },
        { prefix: '/admin/security', perm: 'ANALYTICS_VIEW' },
        { prefix: '/admin/team', perm: 'TEAM_VIEW' },
        { prefix: '/admin/roles', perm: 'USERS_MANAGE' },
        { prefix: '/admin/permissions', perm: 'USERS_MANAGE' },
        { prefix: '/admin/settings/booking', perm: 'BOOKING_SETTINGS_VIEW' },
      ]
      const match = routePerm.find(r => pathname.startsWith(r.prefix))
      if (match) {
        const key = PERMISSIONS[match.perm]
        if (!hasPermission(role || undefined, key)) {
          return NextServer.NextResponse.redirect(new URL('/admin', req.url))
        }
      }
    } catch {}
  }

  if (isPortalPage && !isAuth) {
    return NextServer.NextResponse.redirect(new URL('/login', req.url))
  }

  // Forward tenant header when multi-tenancy is enabled
  const requestHeaders = new Headers(req.headers)
  try {
    if (String(process.env.MULTI_TENANCY_ENABLED).toLowerCase() === 'true') {
      // Prefer explicit cookie if present
      const cookieHeader = req.headers.get('cookie') || ''
      const cookieTenant = cookieHeader.split(';').map((s: string) => s.trim()).find((s: string) => s.startsWith('tenant='))?.split('=')[1]
      if (cookieTenant) {
        requestHeaders.set('x-tenant-id', cookieTenant)
      } else {
        const hostname = req.nextUrl?.hostname || req.headers.get('host') || ''
        const host = String(hostname).split(':')[0]
        const parts = host.split('.')
        let sub = parts.length >= 3 ? parts[0] : ''
        if (sub === 'www' && parts.length >= 4) sub = parts[1]
        if (sub) requestHeaders.set('x-tenant-id', sub)
      }
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
  matcher: ['/admin/:path*', '/portal/:path*', '/login', '/register'],
}

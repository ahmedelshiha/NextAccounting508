import * as NextServer from 'next/server'
import { getToken } from 'next-auth/jwt'
import { signTenantCookie } from '@/lib/tenant-cookie'
import { logger } from '@/lib/logger'

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
        // Settings pages
        { prefix: '/admin/settings/booking', perm: 'BOOKING_SETTINGS_VIEW' },
        { prefix: '/admin/settings/company', perm: 'ORG_SETTINGS_VIEW' },
        { prefix: '/admin/settings/contact', perm: 'ORG_SETTINGS_VIEW' },
        { prefix: '/admin/settings/timezone', perm: 'ORG_SETTINGS_VIEW' },
        { prefix: '/admin/settings/financial', perm: 'FINANCIAL_SETTINGS_VIEW' },
        { prefix: '/admin/settings/currencies', perm: 'FINANCIAL_SETTINGS_VIEW' },
        { prefix: '/admin/settings/integrations', perm: 'INTEGRATION_HUB_VIEW' },
        { prefix: '/admin/settings/clients', perm: 'CLIENT_SETTINGS_VIEW' },
        { prefix: '/admin/settings/team', perm: 'TEAM_SETTINGS_VIEW' },
        { prefix: '/admin/settings/tasks', perm: 'TASK_WORKFLOW_SETTINGS_VIEW' },
        { prefix: '/admin/settings/analytics', perm: 'ANALYTICS_REPORTING_SETTINGS_VIEW' },
        { prefix: '/admin/settings/communication', perm: 'COMMUNICATION_SETTINGS_VIEW' },
        { prefix: '/admin/settings/security', perm: 'SECURITY_COMPLIANCE_SETTINGS_VIEW' },
        { prefix: '/admin/settings/system', perm: 'SYSTEM_ADMIN_SETTINGS_VIEW' },
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

  // Build request headers while stripping any inbound tenant headers to prevent spoofing
  const requestHeaders = new Headers(req.headers)
  requestHeaders.delete('x-tenant-id')
  requestHeaders.delete('x-tenant-slug')

  try {
    if (String(process.env.MULTI_TENANCY_ENABLED).toLowerCase() === 'true') {
      // Prefer tenant from authenticated session token when available (trusted)
      const tenantIdFromToken = token ? (token as any).tenantId : null
      const tenantSlugFromToken = token ? (token as any).tenantSlug : null
      let tenantToSet: string | null = null
      let tenantSlugToSet: string | null = null

      if (tenantIdFromToken) {
        tenantToSet = String(tenantIdFromToken)
        tenantSlugToSet = tenantSlugFromToken ? String(tenantSlugFromToken) : null
      } else {
        // Fallback to subdomain when unauthenticated
        const hostname = req.nextUrl?.hostname || req.headers.get('host') || ''
        const host = String(hostname).split(':')[0]
        const parts = host.split('.')
        let sub = parts.length >= 3 ? parts[0] : ''
        if (sub === 'www' && parts.length >= 4) sub = parts[1]
        if (sub) tenantToSet = sub
      }

      if (tenantToSet) requestHeaders.set('x-tenant-id', tenantToSet)
      if (tenantSlugToSet) requestHeaders.set('x-tenant-slug', tenantSlugToSet)

      // If authenticated, issue a signed tenant cookie for subsequent verification
      if (isAuth) {
        try {
          const userId = String((token as any).userId ?? (token as any).sub ?? '')
          const signed = signTenantCookie(String(tenantToSet ?? ''), userId)
          // We'll set the cookie on the response below

          const res = NextServer.NextResponse.next({ request: { headers: requestHeaders } })

          // Set verified tenant headers (server-side only)
          if (tenantToSet) res.headers.set('x-tenant-id', tenantToSet)
          if (tenantSlugToSet) res.headers.set('x-tenant-slug', tenantSlugToSet)
          if (userId) res.headers.set('x-user-id', userId)

          // Attach signed tenant cookie
          res.cookies.set('tenant_sig', signed, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
          })

          // Prevent caching of sensitive pages
          if (isAdminPage || isPortalPage) {
            res.headers.set('Cache-Control', 'no-store')
            res.headers.set('Pragma', 'no-cache')
          }

          // Log request
          logger.info('Middleware: authenticated request processed', {
            tenantId: tenantToSet,
            userId,
            pathname,
          })

          return res
        } catch (err) {
          logger.error('Middleware: failed to sign tenant cookie', { error: err })
        }
      }
    }
  } catch (err) {
    logger.error('Middleware error while resolving tenant', { error: err })
  }

  const res = NextServer.NextResponse.next({ request: { headers: requestHeaders } })

  // Prevent caching of sensitive pages
  if (isAdminPage || isPortalPage) {
    res.headers.set('Cache-Control', 'no-store')
    res.headers.set('Pragma', 'no-cache')
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*', '/api/:path*', '/login', '/register'],
}

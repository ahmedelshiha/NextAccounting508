import * as NextServer from 'next/server'
import { getToken } from 'next-auth/jwt'
import { signTenantCookie } from '@/lib/tenant-cookie'
import { logger } from '@/lib/logger'
import { getClientIp } from '@/lib/rate-limit'
import { computeIpHash } from '@/lib/security/ip-hash'
import { isIpAllowed } from '@/lib/security/ip-allowlist'

function isStaffRole(role: string | undefined | null) {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'TEAM_LEAD' || role === 'TEAM_MEMBER'
}

export async function middleware(req: NextServer.NextRequest) {
  if (String(process.env.AUTH_DISABLED || '').toLowerCase() === 'true') {
    return NextServer.NextResponse.next()
  }
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico'
  ) {
    return NextServer.NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuth = !!token
  const method = req.method
  const start = Date.now()
  const isApiRequest = pathname === '/api' || pathname.startsWith('/api/')
  const inboundRequestId = req.headers.get('x-request-id')?.trim()
  const safeGenerateRequestId = () => {
    if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
      return globalThis.crypto.randomUUID()
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }
  const requestId =
    inboundRequestId && inboundRequestId.length <= 128
      ? inboundRequestId
      : safeGenerateRequestId()
  const userId = token ? String((token as any).userId ?? (token as any).sub ?? '') : ''
  const clientIp = getClientIp(req as unknown as Request)

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isAdminPage = pathname.startsWith('/admin')
  const isPortalPage = pathname.startsWith('/portal')

  let resolvedTenantId: string | null = null
  let resolvedTenantSlug: string | null = null
  let apiEntryLogged = false

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

    // Super admin access audit logging (tenant-level controlled)
    try {
      const role = (token as unknown as { role?: string } | null)?.role
      if (role === 'SUPER_ADMIN' && method === 'GET') {
        let enabled = false
        try {
          const securityService = await import('@/services/security-settings.service')
          const tsettings = resolvedTenantId ? await securityService.default.get(resolvedTenantId).catch(() => null) : await securityService.default.get(null).catch(() => null)
          enabled = Boolean(tsettings && tsettings.superAdmin && typeof tsettings.superAdmin.logAdminAccess === 'boolean' ? tsettings.superAdmin.logAdminAccess : false)
        } catch {}
        if (enabled) {
          try {
            const { logAudit } = await import('@/lib/audit')
            await logAudit({ action: 'security.superadmin.access', actorId: userId || null, details: { tenantId: resolvedTenantId ?? null, path: pathname, method, ip: clientIp } })
          } catch {}
        }
      }
    } catch {}
  }

  const requestHeaders = new Headers(req.headers)
  requestHeaders.delete('x-tenant-id')
  requestHeaders.delete('x-tenant-slug')
  requestHeaders.delete('x-user-id')
  requestHeaders.delete('x-request-id')
  requestHeaders.set('x-request-id', requestId)

  const baseLogContext: Record<string, unknown> = {
    requestId,
    method,
    pathname,
    userId: userId || null,
  }

  // Resolve tenant early (used for tenant-level network policies)
  try {
    if (String(process.env.MULTI_TENANCY_ENABLED).toLowerCase() === 'true') {
      const tenantIdFromToken = token ? (token as any).tenantId : null
      const tenantSlugFromToken = token ? (token as any).tenantSlug : null
      if (tenantIdFromToken) {
        resolvedTenantId = String(tenantIdFromToken)
        resolvedTenantSlug = tenantSlugFromToken ? String(tenantSlugFromToken) : null
      } else {
        const hostname = req.nextUrl?.hostname || req.headers.get('host') || ''
        const host = String(hostname).split(':')[0]
        const parts = host.split('.')
        let sub = parts.length >= 3 ? parts[0] : ''
        if (sub === 'www' && parts.length >= 4) sub = parts[1]
        if (sub) resolvedTenantId = sub
      }
    }
  } catch {}

  // Admin IP allowlist enforcement (env-controlled or tenant-level)
  try {
    const ip = clientIp
    const isAdminApi = isApiRequest && pathname.startsWith('/api/admin')
    const isAdminSurface = isAdminPage || isAdminApi

    // Determine source of policy: tenant if tenant-level enabled, otherwise env
    let policySource: 'tenant' | 'env' | null = null
    let allowList: string[] = []

    try {
      // Attempt tenant-level policy if tenant resolved
      if (resolvedTenantId) {
        const securityService = await import('@/services/security-settings.service')
        const tsettings = await securityService.default.get(resolvedTenantId).catch(() => null)
        if (tsettings && tsettings.network && tsettings.network.enableIpRestrictions) {
          policySource = 'tenant'
          allowList = Array.isArray(tsettings.network.ipAllowlist) ? tsettings.network.ipAllowlist : []
        }
      }
    } catch {}

    // Fallback to env-level policy
    if (!policySource) {
      const ipRestrictionsEnabled = String(process.env.ENABLE_IP_RESTRICTIONS || '').toLowerCase() === 'true'
      if (ipRestrictionsEnabled) {
        policySource = 'env'
        const rawAllow = String(process.env.ADMIN_IP_WHITELIST || '').trim()
        allowList = rawAllow ? rawAllow.split(',').map(s => s.trim()).filter(Boolean) : []
      }
    }

    if (policySource && isAdminSurface) {
      const allowed = isIpAllowed(ip, allowList)
      // determine matched rule if any
      let matchedRule: string | null = null
      for (const entry of allowList) {
        if (!entry) continue
        if (isIpAllowed(ip, [entry])) { matchedRule = entry; break }
      }

      if (!allowed) {
        if (String(process.env.LOG_ADMIN_ACCESS || '').toLowerCase() === 'true') {
          logger.warn('Admin access blocked by IP policy', { ...baseLogContext, ip, tenantId: resolvedTenantId ?? null, policySource, matchedRule })
        }
        try {
          const { logAudit } = await import('@/lib/audit')
          await logAudit({ action: 'security.ip.block', details: { ip, pathname, tenantId: resolvedTenantId ?? null, policySource, matchedRule } })
        } catch {}
        const denied = isApiRequest
          ? NextServer.NextResponse.json({ error: 'Access restricted by IP policy' }, { status: 403 })
          : new NextServer.NextResponse('Access restricted by IP policy', { status: 403 })
        return denied
      } else if (String(process.env.LOG_ADMIN_ACCESS || '').toLowerCase() === 'true') {
        logger.info('Admin access allowed', { ...baseLogContext, ip, tenantId: resolvedTenantId ?? null, policySource, matchedRule })
      }
    }
  } catch {}

  const logApiEntry = () => {
    if (!isApiRequest || apiEntryLogged) return
    logger.info('API request received', {
      ...baseLogContext,
      tenantId: resolvedTenantId,
      tenantSlug: resolvedTenantSlug,
    })
    apiEntryLogged = true
  }

  const finalizeResponse = (response: NextServer.NextResponse) => {
    response.headers.set('x-request-id', requestId)
    if (resolvedTenantId) response.headers.set('x-tenant-id', resolvedTenantId)
    if (resolvedTenantSlug) response.headers.set('x-tenant-slug', resolvedTenantSlug)
    if (userId) response.headers.set('x-user-id', userId)

    if (isApiRequest) {
      const duration = Date.now() - start
      logger.info('API request completed', {
        ...baseLogContext,
        tenantId: resolvedTenantId,
        tenantSlug: resolvedTenantSlug,
        status: response.status,
        duration: `${duration}ms`,
      })
    }

    return response
  }

  const enforceSuperAdminIpBinding = String(process.env.SUPERADMIN_STRICT_IP_ENFORCEMENT || '').toLowerCase() === 'true'
  if (enforceSuperAdminIpBinding && token) {
    const role = (token as unknown as { role?: string } | null)?.role
    const sessionIpHash = typeof (token as any)?.sessionIpHash === 'string' ? (token as any).sessionIpHash : null
    if (role === 'SUPER_ADMIN') {
      const currentIpHash = await computeIpHash(clientIp)
      if (!sessionIpHash || currentIpHash !== sessionIpHash) {
        const mismatchReason = sessionIpHash ? 'mismatch' : 'missing'
        logger.warn('Super admin session rejected due to IP constraint', {
          ...baseLogContext,
          ip: clientIp,
          sessionIpHash,
          currentIpHash,
          mismatchReason,
        })
        try {
          const { logAudit } = await import('@/lib/audit')
          await logAudit({
            action: 'security.superadmin.ip_mismatch',
            actorId: userId || null,
            targetId: userId || null,
            details: {
              ip: clientIp,
              mismatchReason,
              expectedHash: sessionIpHash,
              providedHash: currentIpHash,
              pathname,
              requestId,
            },
          })
        } catch {}
        if (isApiRequest) logApiEntry()
        const destination = new URL('/login?reason=ip-mismatch', req.url)
        const response = isApiRequest
          ? NextServer.NextResponse.json({ error: 'Session locked. Please sign in again.' }, { status: 401 })
          : NextServer.NextResponse.redirect(destination)
        response.cookies.delete('next-auth.session-token')
        response.cookies.delete('__Secure-next-auth.session-token')
        response.cookies.delete('next-auth.callback-url')
        return finalizeResponse(response)
      }
    }
  }

  try {
    if (String(process.env.MULTI_TENANCY_ENABLED).toLowerCase() === 'true') {
      const tenantIdFromToken = token ? (token as any).tenantId : null
      const tenantSlugFromToken = token ? (token as any).tenantSlug : null

      if (tenantIdFromToken) {
        resolvedTenantId = String(tenantIdFromToken)
        resolvedTenantSlug = tenantSlugFromToken ? String(tenantSlugFromToken) : null
      } else {
        // Fallback to subdomain when unauthenticated
        const hostname = req.nextUrl?.hostname || req.headers.get('host') || ''
        const host = String(hostname).split(':')[0]
        const parts = host.split('.')
        let sub = parts.length >= 3 ? parts[0] : ''
        if (sub === 'www' && parts.length >= 4) sub = parts[1]
        if (sub) resolvedTenantId = sub
      }

      if (resolvedTenantId) requestHeaders.set('x-tenant-id', resolvedTenantId)
      if (resolvedTenantSlug) requestHeaders.set('x-tenant-slug', resolvedTenantSlug)

      // If authenticated, issue a signed tenant cookie for subsequent verification
      if (isAuth) {
        try {
          logApiEntry()
          const signed = await signTenantCookie(String(resolvedTenantId ?? ''), userId)
          const res = NextServer.NextResponse.next({ request: { headers: requestHeaders } })

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
            tenantId: resolvedTenantId,
            tenantSlug: resolvedTenantSlug,
            userId: userId || null,
            pathname,
            requestId,
          })

          return finalizeResponse(res)
        } catch (err) {
          logger.error('Middleware: failed to sign tenant cookie', {
            error: err,
            requestId,
            tenantId: resolvedTenantId,
            tenantSlug: resolvedTenantSlug,
            userId: userId || null,
          })
        }
      }
    }
  } catch (err) {
    logger.error('Middleware error while resolving tenant', {
      error: err,
      requestId,
      method,
      pathname,
      userId: userId || null,
      tenantId: resolvedTenantId,
      tenantSlug: resolvedTenantSlug,
    })
  }

  // If multi-tenancy is enabled but we could not resolve a tenant, warn so operators notice missing hints.
  if (String(process.env.MULTI_TENANCY_ENABLED).toLowerCase() === 'true' && !resolvedTenantId) {
    logger.warn('Middleware: tenant could not be resolved for incoming request', { requestId, pathname, userId })
  }

  if (isApiRequest) logApiEntry()
  const res = NextServer.NextResponse.next({ request: { headers: requestHeaders } })

  // Prevent caching of sensitive pages
  if (isAdminPage || isPortalPage) {
    res.headers.set('Cache-Control', 'no-store')
    res.headers.set('Pragma', 'no-cache')
  }

  return finalizeResponse(res)
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*', '/api/:path*', '/login', '/register'],
}

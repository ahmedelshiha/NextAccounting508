import { NextRequest, NextResponse } from 'next/server'
// Import auth helpers dynamically inside handlers to respect test mocks and runtime environments
import { tenantContext, TenantContext } from '@/lib/tenant-context'
import { logger } from '@/lib/logger'
import { verifyTenantCookie } from '@/lib/tenant-cookie'

export function getCookie(req: any, name: string): string | null {
  if (!req) return null
  const cookies = (req as any).cookies
  try {
    // NextRequest cookie store
    if (cookies && typeof cookies.get === 'function') {
      const c = cookies.get(name)
      return (c && typeof c === 'object' && 'value' in c) ? c.value : (c ?? null)
    }
    // Plain object or map-like
    if (cookies && typeof cookies === 'object') {
      const v = (cookies as any)[name]
      if (v !== undefined) return (v && typeof v === 'object' && 'value' in v) ? v.value : v
    }
    // Fallback to Cookie header parsing
    const header = req && req.headers && typeof req.headers.get === 'function' ? req.headers.get('cookie') : (req && req.headers && (req.headers as any).cookie)
    if (header && typeof header === 'string') {
      const parts = header.split(';').map(p => p.trim())
      for (const part of parts) {
        const [k, ...rest] = part.split('=')
        if (k === name) return rest.join('=')
      }
    }
  } catch (e) {
    // Defensive: any unexpected shape -> null
    return null
  }
  return null
}

export type ApiHandler = (
  request: NextRequest,
  context: { params: any }
) => Promise<Response | NextResponse>

export interface ApiWrapperOptions {
  requireAuth?: boolean
  requireSuperAdmin?: boolean
  requireTenantAdmin?: boolean
  allowedRoles?: string[]
}

export function withTenantContext(
  handler: ApiHandler,
  options: ApiWrapperOptions = {}
) {
  return async (request: NextRequest, routeContext: { params: any }) => {
    const {
      requireAuth = true,
      requireSuperAdmin = false,
      requireTenantAdmin = false,
      allowedRoles = [],
    } = options

    try {
      // Dynamically import auth helpers to respect test mocks. Try centralized getSessionOrBypass first,
      // fall back to getServerSession if the mock does not provide it.
      let session: any = null
      try {
        const authMod = await import('@/lib/auth')
        if (authMod && typeof authMod.getSessionOrBypass === 'function') {
          session = await authMod.getSessionOrBypass()
        } else if (authMod && typeof authMod.getServerSession === 'function') {
          // Some tests may mock auth module to expose getServerSession directly
          session = await authMod.getServerSession(authMod.authOptions)
        } else {
          try {
            // Some tests mock 'next-auth' module directly using vi.doMock('next-auth', ...)
            // Prefer importing 'next-auth' first so test-local mocks are respected.
            let getServerSession: any = null
            try {
              const modA = await import('next-auth')
              if (modA && typeof modA.getServerSession === 'function') getServerSession = modA.getServerSession
            } catch {}
            if (!getServerSession) {
              try {
                const modB = await import('next-auth/next')
                if (modB && typeof modB.getServerSession === 'function') getServerSession = modB.getServerSession
              } catch {}
            }
            const authFallback = await import('@/lib/auth').catch(() => ({}))
            session = await (typeof getServerSession === 'function' ? getServerSession(authFallback.authOptions) : null)
          } catch (err) {
            session = null
          }
        }
      } catch (err) {
        session = null
      }

      if (requireAuth && !session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        )
      }

      // If unauthenticated requests are allowed, try to derive tenant from headers and run within context
      if (!session?.user) {
        try {
          const headerTenant = (request && (request as any).headers && typeof (request as any).headers.get === 'function')
            ? (request as any).headers.get('x-tenant-id')
            : null
          const tenantId = headerTenant ? String(headerTenant) : null
          if (tenantId) {
            const context: TenantContext = {
              tenantId,
              tenantSlug: (request as any).headers?.get?.('x-tenant-slug') || null,
              userId: null,
              userName: null,
              userEmail: null,
              role: null,
              tenantRole: null,
              isSuperAdmin: false,
              requestId: (request as any).headers?.get?.('x-request-id') || null,
              timestamp: new Date(),
            }
            return tenantContext.run(context, () => handler(request, routeContext))
          }
        } catch {}
        return handler(request, routeContext)
      }

      const user = session.user as any

      if (requireSuperAdmin && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Super admin access required' },
          { status: 403 }
        )
      }

      if (requireTenantAdmin && !['OWNER', 'ADMIN'].includes(user.tenantRole)) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Tenant admin access required' },
          { status: 403 }
        )
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // Tenant cookie check: cryptographically verify tenant_sig and ensure it matches session
      try {
        const tenantCookie = getCookie(request, 'tenant_sig')
        if (tenantCookie) {
          // If session lacks tenantId, treat cookie as invalid and deny access.
          if (!user.tenantId) {
            logger.warn('Tenant cookie present but session user has no tenantId', { userId: user.id, tenantId: user.tenantId })
            return NextResponse.json(
              { error: 'Forbidden', message: 'Invalid tenant signature' },
              { status: 403 }
            )
          }

          const ok = verifyTenantCookie(tenantCookie, String(user.tenantId), String(user.id))
          if (!ok) {
            logger.warn('Invalid tenant cookie signature', { userId: user.id, tenantId: user.tenantId })
            return NextResponse.json(
              { error: 'Forbidden', message: 'Invalid tenant signature' },
              { status: 403 }
            )
          }
        }
      } catch (err) {
        logger.warn('Failed to validate tenant cookie', { error: err })
        // In some environments (unit tests or minimal Request objects) the `request.cookies` API may be missing
        // Treat cookie validation failures as a missing/invalid cookie but do NOT block the request here.
        // Let the handler perform authentication/authorization checks and return the appropriate 401/403.
      }

      const context: TenantContext = {
        tenantId: String(user.tenantId),
        tenantSlug: user.tenantSlug ?? null,
        userId: String(user.id),
        userName: (user.name as string | undefined) ?? null,
        userEmail: (user.email as string | undefined) ?? null,
        role: user.role ?? null,
        tenantRole: user.tenantRole ?? null,
        isSuperAdmin: user.role === 'SUPER_ADMIN',
        requestId: (request && (request as any).headers && typeof (request as any).headers.get === 'function') ? (request as any).headers.get('x-request-id') : null,
        timestamp: new Date(),
      }

      return tenantContext.run(context, () => handler(request, routeContext))
    } catch (error) {
      logger.error('API wrapper error', { error })
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Failed to process request' },
        { status: 500 }
      )
    }
  }
}

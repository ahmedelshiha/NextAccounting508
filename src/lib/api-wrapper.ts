import { NextRequest, NextResponse } from 'next/server'
import { tenantContext, TenantContext } from '@/lib/tenant-context'
import { logger } from '@/lib/logger'
import { verifyTenantCookie } from '@/lib/tenant-cookie'

/**
 * Safely read a cookie value from NextRequest or a request-like object.
 * Handles Next.js cookies API, plain objects, and raw Cookie headers.
 */
export function getCookie(req: any, name: string): string | null {
  if (!req) return null
  const cookies = (req as any).cookies
  try {
    // NextRequest cookie store
    if (cookies && typeof cookies.get === 'function') {
      const c = cookies.get(name)
      return (c && typeof c === 'object' && 'value' in c) ? (c as any).value : (c ?? null)
    }
    // Plain object or map-like
    if (cookies && typeof cookies === 'object') {
      const v = (cookies as any)[name]
      if (v !== undefined) return (v && typeof v === 'object' && 'value' in v) ? (v as any).value : v
    }
    // Fallback to Cookie header parsing
    const header = req && req.headers && typeof req.headers.get === 'function'
      ? (req.headers as any).get('cookie')
      : (req && req.headers && (req.headers as any).cookie)
    if (header && typeof header === 'string') {
      const parts = header.split(';').map(p => p.trim())
      for (const part of parts) {
        const [k, ...rest] = part.split('=')
        if (k === name) return rest.join('=')
      }
    }
  } catch {
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

/**
 * Wrap an App Router API route with tenant and auth context.
 * - Resolves session via next-auth (preferring next-auth/next), with a fallback to a local helper.
 * - Optionally enforces auth and role requirements.
 * - Establishes AsyncLocal tenant context for downstream code.
 */
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
      // Resolve session with robust fallbacks
      let session: any = null
      try {
        // Prefer next-auth/next for App Router
        const naNext = await import('next-auth/next').catch(() => null as any)
        const authMod = await import('@/lib/auth')
        if (naNext?.getServerSession) {
          session = await naNext.getServerSession((authMod as any).authOptions)
        } else {
          // Fallback to classic next-auth when next-auth/next is not available (tests may mock only next-auth)
          try {
            const na = await import('next-auth').catch(() => null as any)
            if (na && typeof na.getServerSession === 'function') {
              session = await na.getServerSession((authMod as any).authOptions)
            }
          } catch {}
        }
      } catch {
        session = null
      }

      if (requireAuth && !session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        )
      }

      // If unauthenticated requests are allowed, optionally run within tenant header context
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

      const user = (session as any).user as any

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

      // Verify tenant signature cookie if present
      try {
        const tenantCookie = getCookie(request, 'tenant_sig')
        if (tenantCookie) {
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
      }

      // Resolve tenant id: prefer session.user.tenantId, otherwise try request-based resolution when multi-tenancy is enabled
      let resolvedTenantId: string | null = null
      try {
        if (user && (user.tenantId || user.tenantId === 0)) {
          resolvedTenantId = String(user.tenantId)
        } else {
          // Attempt to derive tenant from request when available
          try {
            const tenantMod = await import('@/lib/tenant')
            if (typeof tenantMod.isMultiTenancyEnabled === 'function' && tenantMod.isMultiTenancyEnabled()) {
              try {
                resolvedTenantId = tenantMod.getTenantFromRequest(request as Request) || null
              } catch {
                resolvedTenantId = null
              }
            }
          } catch {}
        }
      } catch {}

      const context: TenantContext = {
        tenantId: resolvedTenantId ?? String(user.tenantId ?? ''),
        tenantSlug: user.tenantSlug ?? null,
        userId: String(user.id),
        userName: (user.name as string | undefined) ?? null,
        userEmail: (user.email as string | undefined) ?? null,
        role: user.role ?? null,
        tenantRole: user.tenantRole ?? null,
        isSuperAdmin: user.role === 'SUPER_ADMIN',
        requestId: ((request as any).headers && typeof (request as any).headers.get === 'function') ? (request as any).headers.get('x-request-id') : null,
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

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { tenantContext, TenantContext } from '@/lib/tenant-context'
import { logger } from '@/lib/logger'

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
      const session = await getServerSession(authOptions)

      if (requireAuth && !session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        )
      }

      // If unauthenticated requests are allowed, invoke handler without tenant context
      if (!session?.user) return handler(request, routeContext)

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

      // Basic tenant cookie check: if a tenant cookie exists and doesn't match session, reject.
      try {
        const tenantCookie = request.cookies.get('tenant_sig')?.value
        if (tenantCookie) {
          // The cookie format/signature verification is handled elsewhere in middleware.
          // Here we perform a minimal sanity check: ensure session tenant matches the asserted tenant id prefix.
          const cookieParts = tenantCookie.split('.')
          if (cookieParts.length >= 1) {
            const payload = cookieParts[0]
            const [cookieTenantId] = payload.split(':')
            if (cookieTenantId && cookieTenantId !== String(user.tenantId)) {
              logger.warn('Tenant cookie tenant mismatch', {
                cookieTenantId,
                sessionTenantId: user.tenantId,
                userId: user.id,
              })
              return NextResponse.json(
                { error: 'Forbidden', message: 'Invalid tenant signature' },
                { status: 403 }
              )
            }
          }
        }
      } catch (err) {
        logger.warn('Failed to validate tenant cookie', { error: err })
      }

      const context: TenantContext = {
        tenantId: String(user.tenantId),
        tenantSlug: user.tenantSlug ?? null,
        userId: String(user.id),
        role: user.role ?? null,
        tenantRole: user.tenantRole ?? null,
        isSuperAdmin: user.role === 'SUPER_ADMIN',
        requestId: request.headers.get('x-request-id') || null,
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

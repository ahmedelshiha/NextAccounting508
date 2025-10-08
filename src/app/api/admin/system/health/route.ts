import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { collectSystemHealth } from '@/lib/health'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { withTenantContext } from '@/lib/api-wrapper'
import { tenantContext } from '@/lib/tenant-context'

export const runtime = 'nodejs'

/**
 * Admin system health endpoint.
 * Requires authenticated tenant context with ANALYTICS_VIEW permission.
 * Returns a consolidated SystemHealth payload including optional realtime metrics.
 */
export const GET = withTenantContext(
  async (_request: NextRequest) => {
    try {
      const { role } = tenantContext.getContext()
      if (!hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const health = await collectSystemHealth({ includeRealtime: true })
      return NextResponse.json(health)
    } catch (error) {
      console.error('System health rollup error:', error)
      return NextResponse.json({ error: 'Failed to load system health' }, { status: 500 })
    }
  },
  { requireAuth: true }
)

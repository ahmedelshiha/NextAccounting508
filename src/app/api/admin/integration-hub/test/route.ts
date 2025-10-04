import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { tenantContext } from '@/lib/tenant-context'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import service from '@/services/integration-settings.service'
import * as Sentry from '@sentry/nextjs'

export const POST = withTenantContext(
  async (req: NextRequest) => {
    try {
      const { role, tenantId } = tenantContext.getContext()

      if (!hasPermission(role, PERMISSIONS.INTEGRATION_HUB_TEST)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { provider, payload } = (await req.json().catch(() => ({}))) as any
      if (!provider) {
        return NextResponse.json({ error: 'Missing provider' }, { status: 400 })
      }

      const result = await service.testConnection(tenantId, provider, payload || {})
      return NextResponse.json(result, { status: result.ok ? 200 : 400 })
    } catch (e) {
      try { Sentry.captureException(e as any) } catch {}
      return NextResponse.json({ error: 'Failed to run integration test' }, { status: 500 })
    }
  },
  { requireAuth: true }
)

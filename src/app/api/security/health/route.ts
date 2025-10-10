import { NextResponse } from 'next/server'

import { collectSystemHealth, toSecurityHealthPayload } from '@/lib/health'

export const runtime = 'nodejs'

/**
 * Public security-focused health endpoint.
 * Provides a compact status summary safe for exposure to external monitors.
 */
const _api_GET = async () => {
  const health = await collectSystemHealth({ includeRealtime: false })
  const payload = toSecurityHealthPayload(health)
  return NextResponse.json(payload)
}

import { withTenantContext } from '@/lib/api-wrapper'
export const GET = withTenantContext(_api_GET, { requireAuth: false })

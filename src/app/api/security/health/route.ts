import { NextResponse } from 'next/server'

import { collectSystemHealth, toSecurityHealthPayload } from '@/lib/health'

export const runtime = 'edge'

/**
 * Public security-focused health endpoint.
 * Provides a compact status summary safe for exposure to external monitors.
 */
export async function GET() {
  const health = await collectSystemHealth({ includeRealtime: false })
  const payload = toSecurityHealthPayload(health)
  return NextResponse.json(payload)
}

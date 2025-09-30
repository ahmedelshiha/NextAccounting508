import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import service from '@/services/integration-settings.service'

export async function POST(req: Request){
  const session = await getServerSession(authOptions as any)
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.INTEGRATION_HUB_TEST)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tenantId = getTenantFromRequest(req as any)
  const { provider, payload } = await req.json().catch(()=>({})) as any
  if (!provider) return NextResponse.json({ error: 'Missing provider' }, { status: 400 })
  const result = await service.testConnection(tenantId, provider, payload || {})
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}

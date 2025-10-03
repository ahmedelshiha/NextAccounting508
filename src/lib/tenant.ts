import type { Prisma } from '@prisma/client'
import { resolveTenantId } from '@/lib/default-tenant'

export function isMultiTenancyEnabled(): boolean {
  return String(process.env.MULTI_TENANCY_ENABLED).toLowerCase() === 'true'
}

function extractSubdomain(hostname: string | null): string | null {
  if (!hostname) return null
  const host = hostname.split(':')[0] // strip port
  const parts = host.split('.')
  if (parts.length < 3) return null
  const sub = parts[0]
  if (sub === 'www') return parts.length >= 4 ? parts[1] : null
  return sub || null
}

export function getTenantFromRequest(req: Request): string | null {
  try {
    const header = req.headers.get('x-tenant-id')
    if (header) return header
    const url = new URL((req as any).url || 'http://localhost')
    return extractSubdomain(url.hostname)
  } catch {
    return null
  }
}

export function tenantFilter(tenantId: string | null, field = 'tenantId'): Record<string, unknown> {
  if (!isMultiTenancyEnabled() || !tenantId) return {}
  return { [field]: tenantId }
}

export async function getResolvedTenantId(source?: string | Request | null): Promise<string> {
  if (typeof source === 'string') return resolveTenantId(source)
  const hint = source ? getTenantFromRequest(source as Request) : null
  return resolveTenantId(hint)
}

export function userByTenantEmail(tenantId: string, email: string): Prisma.UserWhereUniqueInput {
  return { tenantId_email: { tenantId, email } }
}

export function withTenant<T extends Record<string, unknown>>(data: T, tenantId: string, field = 'tenantId'):
T & Record<string, string> {
  const payload = { ...data } as Record<string, unknown>
  const existing = payload[field]
  if (typeof existing === 'string' && existing !== tenantId) {
    throw new Error(`Tenant mismatch for ${field} assignment`)
  }
  payload[field] = tenantId
  return payload as T & Record<string, string>
}

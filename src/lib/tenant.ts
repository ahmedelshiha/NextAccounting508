import type { Prisma } from '@prisma/client'
import { resolveTenantId } from '@/lib/default-tenant'

type HeaderRecord = Record<string, string | string[] | undefined>
type TenantSource = string | Request | { headers?: Headers | HeaderRecord | undefined; url?: string | null } | null | undefined

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

function readHeaderValue(headers: Headers | HeaderRecord | undefined, key: string): string | null {
  if (!headers) return null
  if (typeof (headers as Headers).get === 'function') {
    const value = (headers as Headers).get(key)
    return value ?? null
  }
  const record = headers as HeaderRecord
  const match = record[key] ?? record[key.toLowerCase()]
  if (Array.isArray(match)) return match[0] ?? null
  if (typeof match === 'string') return match
  if (match != null) return String(match)
  return null
}

function extractTenantHint(source: TenantSource): string | null {
  if (!source) return null
  if (typeof source === 'string') return source
  const candidate = source as { headers?: Headers | HeaderRecord; url?: string | null }
  if (candidate.headers && typeof (candidate.headers as Headers).get === 'function') {
    return getTenantFromRequest(source as Request)
  }
  if (source instanceof Request) {
    return getTenantFromRequest(source)
  }
  const headerTenant = readHeaderValue(candidate.headers, 'x-tenant-id')
  if (headerTenant) return headerTenant
  if (candidate.url) {
    try {
      const normalized = candidate.url.startsWith('http')
        ? candidate.url
        : `http://placeholder.local${candidate.url.startsWith('/') ? '' : '/'}${candidate.url}`
      const parsed = new URL(normalized)
      return extractSubdomain(parsed.hostname)
    } catch {}
  }
  const host = readHeaderValue(candidate.headers, 'x-forwarded-host') ?? readHeaderValue(candidate.headers, 'host')
  if (host) return extractSubdomain(host)
  return null
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

export async function getResolvedTenantId(source?: TenantSource): Promise<string> {
  const hint = extractTenantHint(source ?? null)
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

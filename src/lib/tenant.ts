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

import prisma from '@/lib/prisma'

function safeRandomUUID(): string {
  try {
    const g: any = globalThis as any
    if (g && g.crypto && typeof g.crypto.randomUUID === 'function') {
      return g.crypto.randomUUID()
    }
    if (g && g.crypto && typeof g.crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16)
      g.crypto.getRandomValues(bytes)
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    }
  } catch {}
  const rand = Math.random().toString(36).slice(2, 10)
  return `${Date.now().toString(36)}-${rand}`
}

let cachedDefaultTenantId: string | null = null

async function ensureDefaultTenant(): Promise<string> {
  if (cachedDefaultTenantId) return cachedDefaultTenantId

  const primary = await prisma.tenant.findFirst({ where: { slug: 'primary' } })
  if (primary?.id) {
    cachedDefaultTenantId = primary.id
    return primary.id
  }

  const existing = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } })
  if (existing?.id) {
    cachedDefaultTenantId = existing.id
    return existing.id
  }

  const generatedId = `tenant_${safeRandomUUID().replace(/-/g, '').slice(0, 24)}`
  const created = await prisma.tenant.create({
    data: {
      id: generatedId,
      slug: 'primary',
      name: 'Primary Tenant',
      status: 'ACTIVE',
    },
  })
  cachedDefaultTenantId = created.id
  return created.id
}

/**
 * Resolve a tenant id with optional strict mode.
 * When MULTI_TENANCY_ENABLED=true and MULTI_TENANCY_STRICT=true, fail fast when tenant cannot be resolved.
 * Otherwise fall back to creating/returning a default tenant (legacy behavior).
 */
export async function resolveTenantId(hint: string | null | undefined): Promise<string> {
  const multiEnabled = String(process.env.MULTI_TENANCY_ENABLED).toLowerCase() === 'true'
  const strict = multiEnabled && String(process.env.MULTI_TENANCY_STRICT).toLowerCase() === 'true'

  // If a hint was provided, try to resolve to a real tenant id by id or slug
  if (hint && hint.trim().length > 0) {
    const key = hint.trim()
    // 1) Try direct id match
    const byId = await prisma.tenant.findUnique({ where: { id: key }, select: { id: true } }).catch(() => null)
    if (byId?.id) return byId.id
    // 2) Try slug match
    const bySlug = await prisma.tenant.findFirst({ where: { slug: key }, select: { id: true } }).catch(() => null)
    if (bySlug?.id) return bySlug.id
    // 3) If strict, fail; otherwise fall back to default tenant
    if (strict) {
      throw new Error(`Tenant resolution failed: no tenant found for hint "${key}" and MULTI_TENANCY_STRICT is enabled`)
    }
    return ensureDefaultTenant()
  }

  // No hint provided
  if (strict) {
    throw new Error('Tenant resolution failed: MULTI_TENANCY_STRICT is enabled and no tenant hint was provided')
  }
  return ensureDefaultTenant()
}

export async function getDefaultTenantId(): Promise<string> {
  return ensureDefaultTenant()
}

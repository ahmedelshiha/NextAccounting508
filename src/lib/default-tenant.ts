import { randomUUID } from 'crypto'
import prisma from '@/lib/prisma'

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

  const generatedId = `tenant_${randomUUID().replace(/-/g, '').slice(0, 24)}`
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
export async function resolveTenantId(tenantId: string | null | undefined): Promise<string> {
  if (tenantId && tenantId.trim().length > 0) return tenantId

  const multiEnabled = String(process.env.MULTI_TENANCY_ENABLED).toLowerCase() === 'true'
  const strict = multiEnabled && String(process.env.MULTI_TENANCY_STRICT).toLowerCase() === 'true'

  if (strict) {
    throw new Error('Tenant resolution failed: MULTI_TENANCY_STRICT is enabled and no tenant hint was provided')
  }

  return ensureDefaultTenant()
}

export async function getDefaultTenantId(): Promise<string> {
  return ensureDefaultTenant()
}

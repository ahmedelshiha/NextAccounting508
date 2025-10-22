import { tenantContext } from '@/lib/tenant-context'

/**
 * Resolve a tenant id for service layer operations.
 * - If a tenantId is explicitly provided, return it as-is (preserving null).
 * - Otherwise, attempt to read the tenantId from the current tenant context.
 * - Returns null when no tenant id could be resolved (callers should handle global/shared resources).
 */
export function resolveTenantId(providedTenantId?: string | null): string | null {
  if (providedTenantId !== undefined) {
    return providedTenantId === null ? null : providedTenantId
  }

  try {
    return tenantContext.getTenantId()
  } catch {
    return null
  }
}

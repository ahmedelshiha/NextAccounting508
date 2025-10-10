import { tenantContext } from '@/lib/tenant-context'

/**
 * Resolve a tenant id for service layer operations.
 * - If a tenantId is explicitly provided, return it.
 * - Otherwise, try to read tenantId from the current tenant context.
 * - Returns null when no tenant id could be resolved (caller should handle global/shared resources).
 */
export function resolveTenantId(providedTenantId?: string | null): string | null {
  if (typeof providedTenantId !== 'undefined') return providedTenantId === null ? null : providedTenantId
  try {
    return tenantContext.getTenantId()
  } catch (e) {
    // If tenant context isn't available, return null to indicate "no tenant"
    return null
  }
}

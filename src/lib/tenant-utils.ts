import { tenantContext, TenantContext } from './tenant-context'
import { logger } from './logger'

interface TenantAwareAuditPayload {
  action: string
  details?: Record<string, unknown>
}

export function requireTenantContext(): TenantContext {
  try {
    return tenantContext.getContext()
  } catch (error) {
    logger.error('Tenant context required but not available', undefined, error as Error)
    throw error
  }
}

export function getTenantFilter(field: string = 'tenantId'): Record<string, string> {
  const context = requireTenantContext()
  if (!context.tenantId) return {}
  return { [field]: context.tenantId }
}

export function ensureTenantMatch(
  resourceTenantId: string | null | undefined,
  metadata: { resource: string; resourceId: string }
): void {
  const context = requireTenantContext()

  if (tenantContext.isSuperAdmin()) {
    return
  }

  if (!resourceTenantId || resourceTenantId !== context.tenantId) {
    logger.warn('Tenant ownership violation detected', {
      ...metadata,
      resourceTenantId,
      expectedTenantId: context.tenantId,
    })
    throw new Error('Forbidden: resource belongs to a different tenant')
  }
}

export function createTenantAuditEntry(payload: TenantAwareAuditPayload) {
  const context = tenantContext.getContextOrNull()

  return {
    ...payload,
    tenantId: context?.tenantId ?? 'SYSTEM',
    userId: context?.userId ?? 'SYSTEM',
    requestId: context?.requestId ?? null,
    timestamp: new Date().toISOString(),
  }
}

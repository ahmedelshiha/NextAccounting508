const getPrisma = async () => (await import('@/lib/prisma')).default as any
import { tenantContext } from '@/lib/tenant-context'

/**
 * Sets Postgres session variable app.current_tenant_id for the given transaction.
 * This enables Row Level Security (RLS) policies that rely on current_setting('app.current_tenant_id').
 */
export async function setTenantRLSOnTx(tx: any, tenantId: string): Promise<void> {
  if (!tenantId || typeof tenantId !== 'string') throw new Error('setTenantRLSOnTx: tenantId required')
  // Use parameterized raw to avoid SQL injection and work across PG
  await tx.$queryRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`
}

/**
 * Runs the provided callback within a Prisma interactive transaction after
 * setting the per-session tenant id, so all queries inside are subject to RLS.
 *
 * If tenantId is omitted, it will use the current AsyncLocal tenantContext.
 */
export async function withTenantRLS<T>(fn: (tx: any) => Promise<T>, tenantId?: string): Promise<T> {
  const ctxTenant = tenantId || tenantContext.getContextOrNull()?.tenantId || null
  if (!ctxTenant) throw new Error('withTenantRLS: tenantId missing and no tenant context available')

  return (await getPrisma()).$transaction(async (tx: any) => {
    await setTenantRLSOnTx(tx, ctxTenant)
    return fn(tx)
  })
}

// Read-optimized helper: applies RLS and allows transaction tuning for heavy read workloads
export async function withTenantRLSRead<T>(
  fn: (tx: any) => Promise<T>,
  options?: { maxWaitMs?: number; timeoutMs?: number; tenantId?: string }
): Promise<T> {
  const ctxTenant = options?.tenantId || tenantContext.getContextOrNull()?.tenantId || null
  if (!ctxTenant) throw new Error('withTenantRLSRead: tenantId missing and no tenant context available')
  const maxWait = options?.maxWaitMs ?? 5000
  const timeout = options?.timeoutMs ?? 15000
  return (await getPrisma()).$transaction(async (tx: any) => {
    await setTenantRLSOnTx(tx, ctxTenant)
    return fn(tx)
  }, { maxWait, timeout } as any)
}

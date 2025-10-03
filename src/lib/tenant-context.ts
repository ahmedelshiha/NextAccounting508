import { AsyncLocalStorage } from 'async_hooks'

export interface TenantContext {
  tenantId: string
  tenantSlug?: string | null
  userId?: string | null
  role?: string | null
  tenantRole?: string | null
  isSuperAdmin?: boolean
  requestId?: string | null
  timestamp: Date
}

class TenantContextManager {
  private storage = new AsyncLocalStorage<TenantContext>()

  run<T>(context: TenantContext, callback: () => T): T {
    return this.storage.run(context, callback)
  }

  getContext(): TenantContext {
    const context = this.storage.getStore()
    if (!context) {
      throw new Error('Tenant context is not available on the current execution path')
    }
    return context
  }

  getContextOrNull(): TenantContext | null {
    return this.storage.getStore() ?? null
  }

  hasContext(): boolean {
    return this.storage.getStore() !== undefined
  }

  requireTenantId(): string {
    const { tenantId } = this.getContext()
    if (!tenantId) {
      throw new Error('Tenant context is missing tenant identifier')
    }
    return tenantId
  }

  getTenantId(): string | null {
    return this.storage.getStore()?.tenantId ?? null
  }

  isSuperAdmin(): boolean {
    return Boolean(this.storage.getStore()?.isSuperAdmin)
  }
}

export const tenantContext = new TenantContextManager()

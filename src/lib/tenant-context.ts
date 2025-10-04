// Use AsyncLocalStorage only on Node.js server. Avoid static import of 'async_hooks' which breaks Turbopack/browser builds.
let AsyncLocalStorageClass: any = undefined
if (typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // Allow runtime require here because async_hooks is Node-only and static import breaks Turbopack
    AsyncLocalStorageClass = require('async_hooks').AsyncLocalStorage
  } catch (err) {
    AsyncLocalStorageClass = undefined
  }
}

// Fallback polyfill when AsyncLocalStorage is not available (client or build environments).
if (!AsyncLocalStorageClass) {
  AsyncLocalStorageClass = class<T> {
    private _store: T | null = null
    run(store: T, callback: () => any) {
      // simple synchronous call; no async context propagation
      this._store = store
      try {
        return callback()
      } finally {
        this._store = null
      }
    }
    getStore() {
      return this._store
    }
  }
}

export interface TenantContext {
  tenantId: string
  tenantSlug?: string | null
  userId?: string | null
  userName?: string | null
  userEmail?: string | null
  role?: string | null
  tenantRole?: string | null
  isSuperAdmin?: boolean
  requestId?: string | null
  timestamp: Date
}

class TenantContextManager {
  private storage = new AsyncLocalStorageClass<TenantContext>()

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

'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

/**
 * Tenant context information from the current session
 */
export interface TenantContextData {
  tenantId: string | null
  tenantSlug: string | null
  tenantRole: string | null
  tenantName: string | null
  availableTenants: Array<{
    id: string
    slug: string | null
    name: string | null
    role: string | null
  }>
}

/**
 * Hook to access the current tenant context from the session.
 * 
 * The tenant context is automatically resolved and included in the session via:
 * 1. Session user's tenantId (primary source from auth flow)
 * 2. Request-based resolution (subdomain/headers) when multi-tenancy is enabled
 * 3. User's default tenant membership
 * 
 * This hook provides access to:
 * - Current tenant ID, slug, role
 * - Available tenants the user has access to
 * - Tenant metadata from the session
 * 
 * @returns {TenantContextData} Current tenant context information
 * 
 * @example
 * ```tsx
 * const tenant = useTenantContext()
 * console.log(tenant.tenantId) // Current tenant ID
 * console.log(tenant.availableTenants) // All accessible tenants
 * ```
 */
export function useTenantContext(): TenantContextData {
  const { data: session } = useSession()

  return useMemo(() => {
    const user = (session?.user as any) || {}
    const sessionTenant = (session as any) || {}

    return {
      tenantId: user.tenantId ?? sessionTenant.tenantId ?? null,
      tenantSlug: user.tenantSlug ?? sessionTenant.tenantSlug ?? null,
      tenantRole: user.tenantRole ?? sessionTenant.tenantRole ?? null,
      tenantName: user.tenantName ?? null,
      availableTenants: Array.isArray(user.availableTenants)
        ? user.availableTenants
        : Array.isArray(sessionTenant.availableTenants)
          ? sessionTenant.availableTenants
          : [],
    }
  }, [session])
}

/**
 * Hook to get the current tenant ID
 * @returns {string | null} Current tenant ID or null if not set
 */
export function useTenantId(): string | null {
  const { tenantId } = useTenantContext()
  return tenantId
}

/**
 * Hook to get the list of available tenants for the current user
 * @returns {TenantContextData['availableTenants']} List of available tenants
 */
export function useAvailableTenants(): TenantContextData['availableTenants'] {
  const { availableTenants } = useTenantContext()
  return availableTenants
}

/**
 * Hook to check if the current user has access to a specific tenant
 * @param {string} tenantId - The tenant ID to check
 * @returns {boolean} True if the user has access to the tenant
 */
export function useCanAccessTenant(tenantId: string): boolean {
  const { availableTenants } = useTenantContext()
  return availableTenants.some(t => t.id === tenantId)
}

/**
 * Hook to get the current user's role in the active tenant
 * @returns {string | null} The user's role in the current tenant
 */
export function useTenantRole(): string | null {
  const { tenantRole } = useTenantContext()
  return tenantRole
}

/**
 * Hook to check if the current user is a tenant admin
 * @returns {boolean} True if user is OWNER or ADMIN in the current tenant
 */
export function useTenantAdmin(): boolean {
  const role = useTenantRole()
  return role === 'OWNER' || role === 'ADMIN'
}

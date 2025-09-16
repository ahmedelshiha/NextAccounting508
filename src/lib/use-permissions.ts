"use client"
import { useSession } from 'next-auth/react'
import { hasPermission, getRolePermissions, PERMISSIONS, type Permission } from '@/lib/permissions'

export function usePermissions() {
  const { data } = useSession()
  const rawRole = (data?.user as any)?.role as string | undefined
  const role = rawRole === 'STAFF' ? 'TEAM_MEMBER' : rawRole

  const has = (p: Permission) => hasPermission(role, p)

  return {
    role: role || null,
    permissions: getRolePermissions(role),
    has,
    // Back-compat convenience flags used in legacy components
    canViewAnalytics: has(PERMISSIONS.ANALYTICS_VIEW),
    canManageUsers: has(PERMISSIONS.USERS_MANAGE),
    // Legacy areas without granular permissions yet: allow ADMIN only
    canManageBookings: role === 'ADMIN',
    canManagePosts: role === 'ADMIN',
    canManageServices: role === 'ADMIN',
    canManageNewsletter: role === 'ADMIN',
    canViewCurrencies: role === 'ADMIN' || has(PERMISSIONS.ANALYTICS_VIEW),
    canManageCurrencies: role === 'ADMIN',
  }
}

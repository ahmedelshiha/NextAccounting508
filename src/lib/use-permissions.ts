"use client"
import { useSession } from 'next-auth/react'
import { hasPermission } from '@/lib/rbac'

export function usePermissions() {
  const { data } = useSession()
  const role = data?.user?.role
  return {
    role: role || null,
    canViewAnalytics: hasPermission(role, 'view_analytics'),
    canManageUsers: hasPermission(role, 'manage_users'),
    canManageBookings: hasPermission(role, 'manage_bookings'),
    canManagePosts: hasPermission(role, 'manage_posts'),
    canManageServices: hasPermission(role, 'manage_services'),
    canManageNewsletter: hasPermission(role, 'manage_newsletter'),
  }
}

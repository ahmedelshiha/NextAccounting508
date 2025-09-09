export type Role = 'ADMIN' | 'STAFF' | 'CLIENT'

export type Permission =
  | 'view_dashboard'
  | 'view_analytics'
  | 'manage_users'
  | 'manage_bookings'
  | 'manage_posts'
  | 'manage_services'
  | 'manage_newsletter'

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    'view_dashboard',
    'view_analytics',
    'manage_users',
    'manage_bookings',
    'manage_posts',
    'manage_services',
    'manage_newsletter',
  ],
  STAFF: [
    'view_dashboard',
    'view_analytics',
    'manage_bookings',
    'manage_posts',
    'manage_services',
    'manage_newsletter',
  ],
  CLIENT: ['view_dashboard'],
}

export function hasPermission(role: string | undefined | null, permission: Permission) {
  if (!role) return false
  const perms = rolePermissions[(role as Role) ?? 'CLIENT'] || []
  return perms.includes(permission)
}

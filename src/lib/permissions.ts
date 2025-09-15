export const PERMISSIONS = {
  SERVICE_REQUESTS_CREATE: 'service_requests.create',
  SERVICE_REQUESTS_READ_ALL: 'service_requests.read.all',
  SERVICE_REQUESTS_READ_OWN: 'service_requests.read.own',
  SERVICE_REQUESTS_UPDATE: 'service_requests.update',
  SERVICE_REQUESTS_DELETE: 'service_requests.delete',
  SERVICE_REQUESTS_ASSIGN: 'service_requests.assign',

  TASKS_CREATE: 'tasks.create',
  TASKS_READ_ALL: 'tasks.read.all',
  TASKS_READ_ASSIGNED: 'tasks.read.assigned',
  TASKS_UPDATE: 'tasks.update',
  TASKS_DELETE: 'tasks.delete',
  TASKS_ASSIGN: 'tasks.assign',

  TEAM_MANAGE: 'team.manage',
  TEAM_VIEW: 'team.view',

  USERS_MANAGE: 'users.manage',
  USERS_VIEW: 'users.view',

  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export'
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  CLIENT: [
    PERMISSIONS.SERVICE_REQUESTS_CREATE,
    PERMISSIONS.SERVICE_REQUESTS_READ_OWN,
    PERMISSIONS.TASKS_READ_ASSIGNED,
  ],
  TEAM_MEMBER: [
    PERMISSIONS.SERVICE_REQUESTS_READ_ALL,
    PERMISSIONS.SERVICE_REQUESTS_UPDATE,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_READ_ASSIGNED,
    PERMISSIONS.TASKS_UPDATE,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  TEAM_LEAD: [
    PERMISSIONS.SERVICE_REQUESTS_READ_ALL,
    PERMISSIONS.SERVICE_REQUESTS_UPDATE,
    PERMISSIONS.SERVICE_REQUESTS_ASSIGN,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_READ_ALL,
    PERMISSIONS.TASKS_UPDATE,
    PERMISSIONS.TASKS_ASSIGN,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TEAM_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
  ],
  ADMIN: [
    ...Object.values(PERMISSIONS),
  ],
}

export function hasPermission(userRole: string | undefined | null, permission: Permission): boolean {
  if (!userRole) return false
  const allowed = ROLE_PERMISSIONS[userRole]
  return Array.isArray(allowed) ? allowed.includes(permission) : false
}

export function checkPermissions(userRole: string | undefined | null, required: Permission[]): boolean {
  return required.every((p) => hasPermission(userRole, p))
}

export function getRolePermissions(userRole: string | undefined | null): Permission[] {
  if (!userRole) return []
  return ROLE_PERMISSIONS[userRole] ?? []
}

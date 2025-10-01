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
  ANALYTICS_EXPORT: 'analytics.export',

  // Services management
  SERVICES_VIEW: 'services.view',
  SERVICES_CREATE: 'services.create',
  SERVICES_EDIT: 'services.edit',
  SERVICES_DELETE: 'services.delete',
  SERVICES_BULK_EDIT: 'services.bulk.edit',
  SERVICES_EXPORT: 'services.export',
  SERVICES_ANALYTICS: 'services.analytics',
  SERVICES_MANAGE_FEATURED: 'services.manage.featured',

  // Booking settings management
  BOOKING_SETTINGS_VIEW: 'booking.settings.view',
  BOOKING_SETTINGS_EDIT: 'booking.settings.edit',
  BOOKING_SETTINGS_EXPORT: 'booking.settings.export',
  BOOKING_SETTINGS_IMPORT: 'booking.settings.import',
  BOOKING_SETTINGS_RESET: 'booking.settings.reset',

  // Organization settings
  ORG_SETTINGS_VIEW: 'org.settings.view',
  ORG_SETTINGS_EDIT: 'org.settings.edit',
  ORG_SETTINGS_EXPORT: 'org.settings.export',
  ORG_SETTINGS_IMPORT: 'org.settings.import',
  ORG_SETTINGS_RESET: 'org.settings.reset',

  // Financial settings
  FINANCIAL_SETTINGS_VIEW: 'financial.settings.view',
  FINANCIAL_SETTINGS_EDIT: 'financial.settings.edit',
  FINANCIAL_SETTINGS_EXPORT: 'financial.settings.export',

  // Integration Hub
  INTEGRATION_HUB_VIEW: 'integration.settings.view',
  INTEGRATION_HUB_EDIT: 'integration.settings.edit',
  INTEGRATION_HUB_TEST: 'integration.settings.test',
  INTEGRATION_HUB_SECRETS_WRITE: 'integration.settings.secrets.write',

  // Client Management settings
  CLIENT_SETTINGS_VIEW: 'client.settings.view',
  CLIENT_SETTINGS_EDIT: 'client.settings.edit',
  CLIENT_SETTINGS_EXPORT: 'client.settings.export',
  CLIENT_SETTINGS_IMPORT: 'client.settings.import',

  // Team Management settings
  TEAM_SETTINGS_VIEW: 'team.settings.view',
  TEAM_SETTINGS_EDIT: 'team.settings.edit',
  TEAM_SETTINGS_EXPORT: 'team.settings.export',
  TEAM_SETTINGS_IMPORT: 'team.settings.import',

  // Task & Workflow settings
  TASK_WORKFLOW_SETTINGS_VIEW: 'task.settings.view',
  TASK_WORKFLOW_SETTINGS_EDIT: 'task.settings.edit',
  TASK_WORKFLOW_SETTINGS_EXPORT: 'task.settings.export',
  TASK_WORKFLOW_SETTINGS_IMPORT: 'task.settings.import',

  // Analytics & Reporting settings
  ANALYTICS_REPORTING_SETTINGS_VIEW: 'analytics-reporting.settings.view',
  ANALYTICS_REPORTING_SETTINGS_EDIT: 'analytics-reporting.settings.edit',
  ANALYTICS_REPORTING_SETTINGS_EXPORT: 'analytics-reporting.settings.export',
  ANALYTICS_REPORTING_SETTINGS_IMPORT: 'analytics-reporting.settings.import',

  // Communication settings
  COMMUNICATION_SETTINGS_VIEW: 'communication.settings.view',
  COMMUNICATION_SETTINGS_EDIT: 'communication.settings.edit',
  COMMUNICATION_SETTINGS_EXPORT: 'communication.settings.export',
  COMMUNICATION_SETTINGS_IMPORT: 'communication.settings.import',

  // Security & Compliance settings
  SECURITY_COMPLIANCE_SETTINGS_VIEW: 'security-compliance.settings.view',
  SECURITY_COMPLIANCE_SETTINGS_EDIT: 'security-compliance.settings.edit',

  // System Administration settings
  SYSTEM_ADMIN_SETTINGS_VIEW: 'system-admin.settings.view',
  SYSTEM_ADMIN_SETTINGS_EDIT: 'system-admin.settings.edit',
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
    PERMISSIONS.SERVICES_VIEW,
    PERMISSIONS.SERVICES_ANALYTICS,
    PERMISSIONS.SERVICES_EXPORT,
    // Settings visibility (read-only)
    PERMISSIONS.BOOKING_SETTINGS_VIEW,
    PERMISSIONS.ORG_SETTINGS_VIEW,
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
    PERMISSIONS.SERVICES_VIEW,
    PERMISSIONS.SERVICES_ANALYTICS,
    PERMISSIONS.SERVICES_EXPORT,
    // Booking settings
    PERMISSIONS.BOOKING_SETTINGS_VIEW,
    PERMISSIONS.BOOKING_SETTINGS_EDIT,
    PERMISSIONS.BOOKING_SETTINGS_EXPORT,
    PERMISSIONS.BOOKING_SETTINGS_IMPORT,
    PERMISSIONS.BOOKING_SETTINGS_RESET,
    // Organization settings
    PERMISSIONS.ORG_SETTINGS_VIEW,
    PERMISSIONS.ORG_SETTINGS_EDIT,
    PERMISSIONS.ORG_SETTINGS_EXPORT,
    // Financial
    PERMISSIONS.FINANCIAL_SETTINGS_VIEW,
    // Integration Hub (view + test)
    PERMISSIONS.INTEGRATION_HUB_VIEW,
    PERMISSIONS.INTEGRATION_HUB_TEST,
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

/**
 * Check if a user role is included in a list of allowed roles
 * @param userRole The current user's role
 * @param allowedRoles Array of roles that should have access
 * @returns true if the user's role is in the allowed roles list
 */
export function hasRole(userRole: string | undefined | null, allowedRoles: readonly string[]): boolean {
  if (!userRole || !allowedRoles) return false
  return allowedRoles.includes(userRole)
}

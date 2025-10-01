import React from 'react'
import SettingsPermissionWrapper from '@/components/admin/settings/SettingsPermissionWrapper'
import type { Permission } from '@/lib/permissions'

export function withSettingsPermission(permission: Permission | Permission[]) {
  return function SettingsProtected({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
    return (
      <SettingsPermissionWrapper permission={permission} fallback={fallback}>
        {children}
      </SettingsPermissionWrapper>
    )
  }
}

export default withSettingsPermission
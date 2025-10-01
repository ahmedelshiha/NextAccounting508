import type { ReactNode } from 'react'
import SettingsPermissionWrapper from '@/components/admin/settings/SettingsPermissionWrapper'
import type { Permission } from '@/lib/permissions'

export function withSettingsPermission(permission: Permission | Permission[]) {
  return function SettingsProtected(props: { children: ReactNode; fallback?: ReactNode }) {
    return (
      <SettingsPermissionWrapper permission={permission} fallback={props.fallback}>
        {props.children}
      </SettingsPermissionWrapper>
    )
  }
}

export default withSettingsPermission

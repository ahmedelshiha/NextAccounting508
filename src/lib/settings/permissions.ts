import React from 'react'
import React from 'react'
import SettingsPermissionWrapper from '@/components/admin/settings/SettingsPermissionWrapper'
import type { Permission } from '@/lib/permissions'

export function withSettingsPermission(permission: Permission | Permission[]) {
  return function SettingsProtected(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    return React.createElement(SettingsPermissionWrapper as any, { permission, fallback: props.fallback }, props.children)
  }
}

export default withSettingsPermission

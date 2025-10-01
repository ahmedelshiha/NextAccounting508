'use client'

import React from 'react'
import PermissionGate from '@/components/PermissionGate'
import type { Permission } from '@/lib/permissions'

interface Props {
  permission: Permission | Permission[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export default function SettingsPermissionWrapper({ permission, fallback, children }: Props) {
  return (
    <PermissionGate permission={Array.isArray(permission) ? permission : [permission]} fallback={fallback ?? <div className="p-4">You do not have access to this settings area.</div>}>
      {children}
    </PermissionGate>
  )
}

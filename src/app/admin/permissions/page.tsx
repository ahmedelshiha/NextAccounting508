"use client"

import StandardPage from '@/components/dashboard/templates/StandardPage'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import RolePermissionsViewer from '@/components/admin/permissions/RolePermissionsViewer'
import UserPermissionsInspector from '@/components/admin/permissions/UserPermissionsInspector'
import { Users } from 'lucide-react'

export default function AdminPermissionsPage() {
  return (
    <PermissionGate
      permission={[PERMISSIONS.USERS_MANAGE]}
      fallback={<div className="p-6">You do not have access to Permissions.</div>}
    >
      <StandardPage
        title="Permissions"
        subtitle="View role mappings and inspect effective permissions"
        secondaryActions={[{ label: 'Manage Users', icon: Users, onClick: () => { window.location.href = '/admin/users' } }]}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RolePermissionsViewer />
          <UserPermissionsInspector />
        </div>
      </StandardPage>
    </PermissionGate>
  )
}

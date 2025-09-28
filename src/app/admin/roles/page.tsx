"use client"

import StandardPage from '@/components/dashboard/templates/StandardPage'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import RolePermissionsViewer from '@/components/admin/permissions/RolePermissionsViewer'
import { Users } from 'lucide-react'

export default function AdminRolesPage() {
  return (
    <PermissionGate
      permission={[PERMISSIONS.USERS_MANAGE]}
      fallback={<div className="p-6">You do not have access to Roles.</div>}
    >
      <StandardPage
        title="Roles"
        subtitle="System roles and their associated permissions"
        secondaryActions={[{ label: 'Manage Users', icon: Users, onClick: () => { window.location.href = '/admin/users' } }]}
      >
        <RolePermissionsViewer />
      </StandardPage>
    </PermissionGate>
  )
}

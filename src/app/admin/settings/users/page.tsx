'use client'

import React, { useState } from 'react'
import PermissionGate from '@/components/PermissionGate'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import AdminUsersPage from '@/app/admin/users/page'
import AdminRolesPage from '@/app/admin/roles/page'
import AdminPermissionsPage from '@/app/admin/permissions/page'
import { PERMISSIONS } from '@/lib/permissions'

export default function SettingsUsersPage() {
  const [active, setActive] = useState<'users' | 'roles' | 'permissions'>('users')

  const tabs = [
    { key: 'users', label: 'Users' },
    { key: 'roles', label: 'Roles' },
    { key: 'permissions', label: 'Permissions' },
  ]

  return (
    <PermissionGate permission={[PERMISSIONS.USERS_VIEW]} fallback={<div className="p-6">You do not have access to Users & Permissions.</div>}>
      <SettingsShell title="Users & Permissions" description="Manage users, roles and permission mappings" tabs={tabs} activeTab={active} onChangeTab={(k)=> setActive(k as any)}>
        <div>
          {active === 'users' && <AdminUsersPage />}
          {active === 'roles' && <AdminRolesPage />}
          {active === 'permissions' && <AdminPermissionsPage />}
        </div>
      </SettingsShell>
    </PermissionGate>
  )
}

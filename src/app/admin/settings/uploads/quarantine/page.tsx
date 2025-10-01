'use client'

import React from 'react'
import PermissionGate from '@/components/PermissionGate'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import QuarantinePage from '@/app/admin/uploads/quarantine/page'
import { PERMISSIONS } from '@/lib/permissions'

export default function SettingsUploadsQuarantinePage() {
  return (
    <PermissionGate permission={[PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW]} fallback={<div className="p-6">You do not have access to Uploads.</div>}>
      <SettingsShell title="Uploads Quarantine" description="Manage quarantined uploads and review recent uploads">
        <QuarantinePage />
      </SettingsShell>
    </PermissionGate>
  )
}

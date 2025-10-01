'use client'

import React from 'react'
import PermissionGate from '@/components/PermissionGate'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import AdminAuditsPage from '@/app/admin/audits/page'
import { PERMISSIONS } from '@/lib/permissions'

export default function SettingsSecurityAuditsPage() {
  return (
    <PermissionGate permission={[PERMISSIONS.SECURITY_COMPLIANCE_SETTINGS_VIEW]} fallback={<div className="p-6">You do not have access to Audit Logs.</div>}>
      <SettingsShell title="Audit Logs" description="System audit trails and activity logs">
        <AdminAuditsPage />
      </SettingsShell>
    </PermissionGate>
  )
}

'use client'

import React from 'react'
import PermissionGate from '@/components/PermissionGate'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import CronPage from '@/app/admin/cron-telemetry/page'
import { PERMISSIONS } from '@/lib/permissions'

export default function SettingsCronPage() {
  return (
    <PermissionGate permission={[PERMISSIONS.SYSTEM_ADMIN_SETTINGS_VIEW]} fallback={<div className="p-6">You do not have access to Cron Telemetry.</div>}>
      <SettingsShell title="Cron Telemetry" description="Monitor scheduled jobs and telemetry">
        <CronPage />
      </SettingsShell>
    </PermissionGate>
  )
}

'use client'

import SettingsShell from '@/components/admin/settings/SettingsShell'
import SettingsNavigation from '@/components/admin/settings/SettingsNavigation'
import SettingsOverview from '@/components/admin/settings/SettingsOverview'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

export default function AdminSettingsPage() {
  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6">You do not have access to Settings.</div>}>
      <SettingsShell
        title="Settings"
        description="Environment and system configuration overview"
        sidebar={<SettingsNavigation />}
      >
        <div className="max-w-7xl mx-auto px-4">
          <SettingsOverview />
        </div>
      </SettingsShell>
    </PermissionGate>
  )
}

'use client'

import SettingsOverview from '@/components/admin/settings/SettingsOverview'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

export default function AdminSettingsPage() {
  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6">You do not have access to Settings.</div>}>
      <SettingsOverview />
    </PermissionGate>
  )
}

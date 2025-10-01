'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import StandardPage from '@/components/dashboard/templates/StandardPage'
import { Settings } from 'lucide-react'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

import SettingsNavigation from '@/components/admin/settings/SettingsNavigation'
import SettingsOverview from '@/components/admin/settings/SettingsOverview'

export default function AdminSettingsPage() {
  const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL)
  const _hasNextAuth = Boolean(process.env.NEXTAUTH_URL && process.env.NEXTAUTH_SECRET)

  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6">You do not have access to Settings.</div>}>
      <StandardPage
        title="Settings"
        subtitle="Environment and system configuration overview"
        secondaryActions={[{ label: 'Docs', onClick: () => (window.location.href = '/docs') }]}
      >
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
          <SettingsNavigation />

          <div>
            <SettingsOverview />
          </div>
        </div>
      </StandardPage>
    </PermissionGate>
  )
}

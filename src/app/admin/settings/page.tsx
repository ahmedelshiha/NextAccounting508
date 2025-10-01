'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import StandardPage from '@/components/dashboard/templates/StandardPage'
import { Settings } from 'lucide-react'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

export default function AdminSettingsPage() {
  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6">You do not have access to Settings.</div>}>
      <StandardPage
        title="Settings"
        subtitle="Unified settings center — select an item from the left navigation"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Welcome to Settings</h2>
            <p className="text-sm text-muted-foreground mt-2">Manage configuration, permissions and integrations from the left-hand navigation. Select a category to view details.</p>
          </div>
        </div>
      </StandardPage>
    </PermissionGate>
  )
}

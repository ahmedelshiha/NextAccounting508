'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import StandardPage from '@/components/dashboard/templates/StandardPage'
import { Settings } from 'lucide-react'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

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
        <div className="max-w-5xl mx-auto px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Database</CardTitle>
                <CardDescription>Connection status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">NETLIFY_DATABASE_URL</div>
                  <Badge className={hasDb ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {hasDb ? 'Configured' : 'Missing'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>NextAuth configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">NEXTAUTH_URL</div>
                    <Badge className={process.env.NEXTAUTH_URL ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {process.env.NEXTAUTH_URL ? 'Configured' : 'Missing'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">NEXTAUTH_SECRET</div>
                    <Badge className={process.env.NEXTAUTH_SECRET ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {process.env.NEXTAUTH_SECRET ? 'Configured' : 'Missing'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </StandardPage>
    </PermissionGate>
  )
}

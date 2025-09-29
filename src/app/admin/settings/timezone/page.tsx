'use client'

import PermissionGate from '@/components/PermissionGate'
import StandardPage from '@/components/dashboard/templates/StandardPage'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast-api'
import { PERMISSIONS } from '@/lib/permissions'
import { useState } from 'react'

const TZ_OPTIONS = [
  'UTC',
  'America/New_York',
  'Europe/London',
  'Asia/Kolkata',
]

export default function TimezoneSettingsPage() {
  const [tz, setTz] = useState('UTC')

  const handleSave = () => {
    toast.success('Timezone saved')
  }

  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6">You do not have access to Timezone settings.</div>}>
      <StandardPage title="Timezone & Localization" subtitle="Configure timezone and localization preferences">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timezone</CardTitle>
              <CardDescription>Select your account timezone</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <Select onValueChange={(v) => setTz(v)}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TZ_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave}>Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </StandardPage>
    </PermissionGate>
  )
}

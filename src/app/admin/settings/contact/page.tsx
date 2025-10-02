'use client'

import PermissionGate from '@/components/PermissionGate'
import SettingsShell from '@/components/admin/settings/SettingsShell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast-api'
import { PERMISSIONS } from '@/lib/permissions'
import { useState } from 'react'

export default function ContactSettingsPage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const handleSave = () => {
    toast.success('Contact settings saved')
  }

  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6">You do not have access to Contact settings.</div>}>
      <SettingsShell title="Contact" description="Public contact information and support channels">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Where customers can reach you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Support email</label>
                  <Input value={email} onChange={(e) => setEmail((e.target as HTMLInputElement).value)} placeholder="support@company.com" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Support phone</label>
                  <Input value={phone} onChange={(e) => setPhone((e.target as HTMLInputElement).value)} placeholder="+1 555 555 555" />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave}>Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SettingsShell>
    </PermissionGate>
  )
}

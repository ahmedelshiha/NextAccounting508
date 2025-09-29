'use client'

import PermissionGate from '@/components/PermissionGate'
import StandardPage from '@/components/dashboard/templates/StandardPage'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast-api'
import { PERMISSIONS } from '@/lib/permissions'
import { useState } from 'react'

export default function CompanySettingsPage() {
  const [companyName, setCompanyName] = useState('')
  const [address, setAddress] = useState('')

  const handleSave = async () => {
    // Save is wired to local toast for now; integrate with API when available
    toast.success('Company settings saved')
  }

  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6">You do not have access to Company settings.</div>}>
      <StandardPage title="Company" subtitle="Company profile and business details">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update legal and display information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company name</label>
                  <Input value={companyName} onChange={(e) => setCompanyName((e.target as HTMLInputElement).value)} placeholder="Your company name" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <Input value={address} onChange={(e) => setAddress((e.target as HTMLInputElement).value)} placeholder="Street, city, country" />
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

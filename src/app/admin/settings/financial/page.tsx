'use client'

import PermissionGate from '@/components/PermissionGate'
import StandardPage from '@/components/dashboard/templates/StandardPage'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast-api'
import { PERMISSIONS } from '@/lib/permissions'
import { useState } from 'react'

export default function FinancialSettingsPage() {
  const [defaultCurrency, setDefaultCurrency] = useState('USD')

  const handleSave = () => {
    toast.success('Financial settings saved')
  }

  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="p-6">You do not have access to Financial settings.</div>}>
      <StandardPage title="Financial" subtitle="Currency, tax and payment defaults">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Currency</CardTitle>
              <CardDescription>Default currency for reporting and invoicing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default currency</label>
                  <Input value={defaultCurrency} onChange={(e) => setDefaultCurrency((e.target as HTMLInputElement).value)} />
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

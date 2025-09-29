"use client"
import ComplianceDashboard from '@/components/compliance/compliance-dashboard'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <PermissionGate permission={[PERMISSIONS.ANALYTICS_VIEW]} fallback={<div className="min-h-screen bg-gray-50 py-8"><div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"><h1 className="text-3xl font-bold text-gray-900 mb-4">Compliance</h1><p className="text-gray-600 mb-6">You do not have access to Compliance.</p></div></div>}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Compliance</h1>
          <p className="text-gray-600 mb-6">Monitor filings, verification status, and important alerts.</p>
          <ComplianceDashboard />
        </div>
      </div>
    </PermissionGate>
  )
}

"use client"
import StandardPage from '@/components/dashboard/templates/StandardPage'
import TeamManagement from '@/components/admin/team-management'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import TeamWorkloadChart from '@/components/admin/service-requests/team-workload-chart'

export default function AdminTeamPage() {
  return (
    <PermissionGate permission={[PERMISSIONS.TEAM_VIEW]} fallback={<div className="p-6">You do not have access to Team Management.</div>}>
      <StandardPage title="Team Management" subtitle="Manage staff members, availability, and assignments">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-3">
            <TeamWorkloadChart />
          </div>
        </div>
        <TeamManagement hideHeader />
      </StandardPage>
    </PermissionGate>
  )
}

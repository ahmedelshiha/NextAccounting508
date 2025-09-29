"use client"
import StandardPage from '@/components/dashboard/templates/StandardPage'
import TeamManagement from '@/components/admin/team-management'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'

export const metadata = {
  title: 'Team Management | Admin',
  description: 'Manage staff members, availability, and assignments'
}

export default function AdminTeamPage() {
  return (
    <PermissionGate permission={[PERMISSIONS.TEAM_VIEW]} fallback={<div className="p-6">You do not have access to Team Management.</div>}>
      <StandardPage title="Team Management" subtitle="Manage staff members, availability, and assignments">
        <TeamManagement hideHeader />
      </StandardPage>
    </PermissionGate>
  )
}

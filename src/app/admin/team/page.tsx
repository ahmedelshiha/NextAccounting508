import StandardPage from '@/components/dashboard/templates/StandardPage'
import TeamManagement from '@/components/admin/team-management'

export const metadata = {
  title: 'Team Management | Admin',
  description: 'Manage staff members, availability, and assignments'
}

export default function AdminTeamPage() {
  return (
    <StandardPage title="Team Management" subtitle="Manage staff members, availability, and assignments">
      <TeamManagement hideHeader />
    </StandardPage>
  )
}

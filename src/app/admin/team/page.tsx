import TeamManagement from '@/components/admin/team-management'

export const metadata = {
  title: 'Team Management | Admin',
  description: 'Manage staff members, availability, and assignments'
}

export default function AdminTeamPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TeamManagement />
    </div>
  )
}

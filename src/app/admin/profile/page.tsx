import ProfileManagementPanel from '@/components/admin/profile/ProfileManagementPanel'

export default function AdminProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Render the profile management as a normal page */}
      <ProfileManagementPanel isOpen={true} defaultTab="profile" inline />
    </div>
  )
}

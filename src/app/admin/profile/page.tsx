import ProfileManagementPanel from '@/components/admin/profile/ProfileManagementPanel'

export default async function AdminProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Render the profile management as a normal page */}
      {/* @ts-expect-error Server->Client dynamic: component is client */}
      <ProfileManagementPanel isOpen={true} onClose={() => {}} defaultTab="profile" inline />
    </div>
  )
}

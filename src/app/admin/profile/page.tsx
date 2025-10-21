import ProfileManagementPanel from '@/components/admin/profile/ProfileManagementPanel'

export default function AdminProfilePage() {
  return (
    <ProfileManagementPanel isOpen={true} defaultTab="profile" inline fullPage />
  )
}

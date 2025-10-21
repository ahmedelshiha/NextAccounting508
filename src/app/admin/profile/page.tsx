import ProfileManagementPanel from '@/components/admin/profile/ProfileManagementPanel'

export default function AdminProfilePage({ searchParams }: { searchParams?: { tab?: string } }) {
  const tabParam = (searchParams?.tab || '').toLowerCase()
  const allowed = ['profile', 'security', 'preferences'] as const
  const isAllowed = (allowed as readonly string[]).includes(tabParam)
  const defaultTab = (isAllowed ? (tabParam as typeof allowed[number]) : 'profile')
  return (
    <ProfileManagementPanel isOpen={true} defaultTab={defaultTab} inline fullPage />
  )
}

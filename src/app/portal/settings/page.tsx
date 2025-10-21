import { redirect } from 'next/navigation'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const metadata = {
  title: 'Redirecting to Profile Settings',
  description: 'Your settings have moved to the profile management page',
}

export default async function PortalSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  // Permanently redirect all portal/settings traffic to admin/profile
  // Using 'push' ensures this is a permanent redirect (301 equivalent in Next.js)
  redirect('/admin/profile?tab=preferences')
}

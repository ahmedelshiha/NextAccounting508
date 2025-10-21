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
    const nav = await import('next/navigation') as any
    nav.redirect('/login')
  }

  // Permanently redirect all portal/settings traffic to admin/profile
  // Using dynamic import ensures test mocks for next/navigation are used
  const nav = await import('next/navigation') as any
  nav.redirect('/admin/profile?tab=booking')
}

import { Metadata } from 'next'
import { authOptions, getSessionOrBypass } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ClientOnlyAdminLayout from '@/components/admin/layout/ClientOnlyAdminLayout'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

export const metadata: Metadata = {
  title: 'Admin Dashboard - NextAccounting',
  description: 'Professional administrative control panel with real-time analytics and business management tools',
}

interface Props { 
  children: React.ReactNode 
}

/**
 * Modern Admin Layout
 * 
 * Professional server-side layout with client-side enhancements:
 * - Server-side authentication and role validation
 * - Client-side providers for realtime updates
 * - Professional sidebar navigation
 * - Responsive header with breadcrumbs
 * - Error boundaries and performance monitoring
 */
export default async function AdminLayout({ children }: Props) {
  // Server-side authentication guard
  const session = await getSessionOrBypass()
  if (!session?.user) {
    redirect('/login')
  }

  // Role-based access control
  const role = (session.user as any)?.role as string | undefined
  if (role === 'CLIENT') {
    redirect('/portal')
  }

  // Pass session to client layout for initialization
  return (
    <ThemeProvider defaultTheme="light">
      <ClientOnlyAdminLayout session={session}>
        {children}
      </ClientOnlyAdminLayout>
    </ThemeProvider>
  )
}

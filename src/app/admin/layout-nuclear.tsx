import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Administrative control panel',
}

interface Props { children: React.ReactNode }

/**
 * NUCLEAR ADMIN LAYOUT - Completely Hydration-Safe
 * 
 * This layout completely bypasses all complex components and state management
 * to eliminate React Error #185 hydration mismatches.
 * 
 * Once we confirm this works, we can gradually add back features.
 */
export default async function NuclearAdminLayout({ children }: Props) {
  // Server-side auth guard: require an authenticated session
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login')
  }

  // Basic role gate: keep clients in the portal; staff/admin may access admin area
  const role = (session.user as any)?.role as string | undefined
  if (role === 'CLIENT') {
    redirect('/portal')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '0', margin: '0' }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
          Nuclear Admin Layout
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
          Hydration-safe admin layout
        </p>
      </div>
      
      <main style={{ padding: '2rem' }}>
        {children}
      </main>
    </div>
  )
}
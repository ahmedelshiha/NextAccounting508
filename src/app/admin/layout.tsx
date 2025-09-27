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
 * NUCLEAR ADMIN LAYOUT - COMPLETE BYPASS
 * 
 * This layout completely eliminates ALL complex components, providers,
 * dynamic imports, Zustand stores, and any potential hydration sources.
 * 
 * Uses pure HTML/CSS with no React state management or client-side JS.
 */
export default async function AdminLayout({ children }: Props) {
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

  // PURE SERVER-RENDERED LAYOUT - NO CLIENT COMPONENTS
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb', 
      display: 'flex',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* STATIC SIDEBAR - NO DYNAMIC BEHAVIOR */}
      <aside style={{
        width: '256px',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        padding: '1rem',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.25rem', 
            fontWeight: 'bold', 
            color: '#111827' 
          }}>
            NextAccounting
          </h1>
          <p style={{ 
            margin: '0.25rem 0 0 0', 
            fontSize: '0.75rem', 
            color: '#6b7280' 
          }}>
            Admin Dashboard
          </p>
        </div>
        
        <nav>
          <div style={{ marginBottom: '0.5rem' }}>
            <a href="/admin" style={{
              display: 'block',
              padding: '0.75rem 1rem',
              backgroundColor: '#dbeafe',
              color: '#1d4ed8',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              marginBottom: '0.25rem'
            }}>
              📊 Dashboard
            </a>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <a href="/admin/bookings" style={{
              display: 'block',
              padding: '0.75rem 1rem',
              color: '#4b5563',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              marginBottom: '0.25rem'
            }}>
              📅 Bookings
            </a>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <a href="/admin/clients" style={{
              display: 'block',
              padding: '0.75rem 1rem',
              color: '#4b5563',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              marginBottom: '0.25rem'
            }}>
              👥 Clients
            </a>
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div style={{ 
        marginLeft: '256px', 
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* STATIC HEADER */}
        <header style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>
              Nuclear Admin
            </h2>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {session?.user?.name || 'Admin'} ({role})
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ 
          flex: 1, 
          padding: '2rem',
          overflow: 'auto'
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}

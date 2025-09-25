import AdminProvidersClient from './AdminProviders.client'
import { ReactNode } from 'react'

interface AdminProvidersProps {
  children: ReactNode
  session: any
}

/**
 * Server-rendering wrapper for AdminProviders.
 * This returns children immediately so server-side rendering (and unit tests)
 * can assert presence of child content without requiring client-only providers.
 * The full client-side providers are mounted on the client via AdminProvidersClient.
 */
export function AdminProviders({ children, session }: AdminProvidersProps) {
  return (
    <>
      {/* Render children immediately for SSR/tests */}
      {children}
      {/* Mount client-side providers for runtime features (toasts, realtime, SWR, session) */}
      <AdminProvidersClient session={session} />
    </>
  )
}

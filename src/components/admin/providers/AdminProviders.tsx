import { ReactNode } from 'react'

interface AdminProvidersProps {
  children: ReactNode
  session: any
}

/**
 * Server-rendering wrapper for AdminProviders.
 * Render children directly for SSR/tests. Client-side providers are mounted
 * elsewhere in the app runtime.
 */
export function AdminProviders({ children }: AdminProvidersProps) {
  return <>{children}</>
}

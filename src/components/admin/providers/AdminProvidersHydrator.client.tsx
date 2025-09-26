'use client'

import { ReactNode } from 'react'
import AdminProvidersClient from './AdminProviders.client'

export default function AdminProvidersHydrator({ session, children }: { session: any; children?: ReactNode }) {
  // Render the full client providers to enable SWR, Realtime, Toaster, etc.
  return <AdminProvidersClient session={session}>{children}</AdminProvidersClient>
}

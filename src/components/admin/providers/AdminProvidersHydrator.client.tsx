'use client'

import AdminProvidersClient from './AdminProviders.client'

export default function AdminProvidersHydrator({ session }: { session: any }) {
  // Render the full client providers to enable SWR, Realtime, Toaster, etc.
  return <AdminProvidersClient session={session} />
}

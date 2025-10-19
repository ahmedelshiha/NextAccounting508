'use client'

'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'

/**
 * TenantSwitcher (simplified)
 *
 * The application now resolves tenant context automatically. This component
 * no longer exposes manual tenant selection. It simply displays the current
 * tenant identifier / name from the session for informational purposes.
 */
export default function TenantSwitcher() {
  const { data: session } = useSession()
  const user = (session?.user as any) || {}

  const label = useMemo(() => {
    // Prefer a human-friendly tenant name if available, then slug, then id
    return user.tenantName || user.tenantSlug || user.tenantId || user.tenant || 'Primary'
  }, [user])

  return (
    <div className="tenant-indicator text-sm text-gray-700">
      <span className="sr-only">Current tenant:</span>
      <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-800">{label}</span>
    </div>
  )
}

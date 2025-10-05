'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'

function getCookie(name: string): string | null {
  try {
    const m = document.cookie.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='))
    return m ? decodeURIComponent(m.split('=')[1]) : null
  } catch {
    return null
  }
}

function setCookie(name: string, value: string, days = 365) {
  try {
    const expires = new Date(Date.now() + days*24*60*60*1000).toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
  } catch {}
}

export default function TenantSwitcher() {
  const { data: session } = useSession()
  const availableTenants: Array<{ id: string; slug: string | null; name: string | null; role: string | null }>
    = (session?.user as any)?.availableTenants || []

  const [tenant, setTenant] = useState('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    try {
      const currentFromSession = (session?.user as any)?.tenantId || ''
      const cookieTenant = getCookie('tenant')
      const lsTenant = typeof window !== 'undefined' ? window.localStorage.getItem('adminTenant') : null
      const current = currentFromSession || cookieTenant || lsTenant || ''
      setTenant(current)
    } finally {
      setInitialized(true)
    }
  }, [session])

  const canSave = useMemo(() => initialized && (!!tenant && tenant.length > 0), [initialized, tenant])

  const save = async () => {
    if (!canSave) return
    const val = tenant.trim()
    if (!val) return

    try {
      const res = await fetch('/api/tenant/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: val })
      })
      if (res.ok) {
        try { window.localStorage.setItem('adminTenant', val) } catch {}
        window.location.reload()
        return
      }
    } catch {
      try { window.localStorage.setItem('adminTenant', val) } catch {}
      setCookie('tenant', val)
      window.location.reload()
    }
  }

  const hasChoices = Array.isArray(availableTenants) && availableTenants.length > 0

  return (
    <div className="flex items-center gap-2">
      {hasChoices ? (
        <select
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
          className="w-40 md:w-56 px-2 py-1 border border-gray-300 rounded text-sm bg-white"
          aria-label="Select tenant"
        >
          {availableTenants.map(t => (
            <option key={t.id} value={t.id}>
              {(t.name || t.slug || t.id)}{t.role ? ` · ${t.role}` : ''}
            </option>
          ))}
        </select>
      ) : (
        <input
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
          placeholder="tenant id"
          className="w-28 md:w-36 px-2 py-1 border border-gray-300 rounded text-sm"
          aria-label="Tenant ID"
        />
      )}
      <Button variant="outline" size="sm" onClick={save} aria-label="Set tenant">Set</Button>
    </div>
  )
}

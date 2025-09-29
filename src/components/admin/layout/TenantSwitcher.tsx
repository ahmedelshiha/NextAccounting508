'use client'

import { useEffect, useMemo, useState } from 'react'
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
  const [tenant, setTenant] = useState('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    try {
      const cookieTenant = getCookie('tenant')
      const lsTenant = typeof window !== 'undefined' ? window.localStorage.getItem('adminTenant') : null
      const current = cookieTenant || lsTenant || ''
      setTenant(current)
    } finally {
      setInitialized(true)
    }
  }, [])

  const canSave = useMemo(() => initialized, [initialized])

  const save = () => {
    if (!canSave) return
    const val = tenant.trim()
    if (val) {
      try { window.localStorage.setItem('adminTenant', val) } catch {}
      setCookie('tenant', val)
    } else {
      try { window.localStorage.removeItem('adminTenant') } catch {}
      setCookie('tenant', '', -1)
    }
    // Reload to ensure middleware forwards the tenant header for SSR and API calls
    window.location.reload()
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={tenant}
        onChange={(e) => setTenant(e.target.value)}
        placeholder="tenant id"
        className="w-28 md:w-36 px-2 py-1 border border-gray-300 rounded text-sm"
        aria-label="Tenant ID"
      />
      <Button variant="outline" size="sm" onClick={save} aria-label="Set tenant">Set</Button>
    </div>
  )
}

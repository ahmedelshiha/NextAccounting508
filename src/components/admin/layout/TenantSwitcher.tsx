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

  const save = async () => {
    if (!canSave) return
    const val = tenant.trim()
    if (!val) return

    try {
      // Call secure tenant switch endpoint which updates NextAuth JWT
      const res = await fetch('/api/tenant/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: val })
      })
      if (res.ok) {
        // Persist admin UX preference locally for convenience, but server JWT is authoritative
        try { window.localStorage.setItem('adminTenant', val) } catch {}
        window.location.reload()
        return
      }
    } catch (e) {
      // Fallback to local cookie for dev/test
      try { window.localStorage.setItem('adminTenant', val) } catch {}
      setCookie('tenant', val)
      window.location.reload()
    }
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

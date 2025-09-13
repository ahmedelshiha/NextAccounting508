import { useState, useEffect } from 'react'

export const useTaskPermissions = () => {
  const [role, setRole] = useState<string | null>(null)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/users/me', { credentials: 'same-origin' })
        if (!res.ok) return
        const data = await res.json().catch(() => ({}))
        if (!mounted) return
        setRole(data?.user?.role ?? null)
      } catch (e) {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  return { role, isAdmin: role === 'ADMIN' || role === 'STAFF' }
}

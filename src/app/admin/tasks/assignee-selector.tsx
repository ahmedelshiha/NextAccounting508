'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface Member {
  id: string
  name: string
  email?: string
  title?: string
}

export default function AssigneeSelector({ value, onChange }: { value?: string | null; onChange: (id: string | null) => void }) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch('/api/admin/team-members', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.resolve({ teamMembers: [] })))
      .then((data) => {
        if (!mounted) return
        const list = Array.isArray(data)
          ? data
          : (data?.teamMembers || data?.members || [])
        setMembers(
          list.map((m: any) => ({ id: m.id, name: m.name || m.fullName || m.email, email: m.email, title: m.title }))
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} className="w-full border rounded px-3 py-2 text-sm">
      <option value="">Unassigned</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>{m.name}{m.title ? ` — ${m.title}` : ''}</option>
      ))}
    </select>
  )
}

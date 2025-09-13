'use client'

import React, { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

interface Member {
  id: string
  name: string
  email?: string
  title?: string
}

export default function AssigneeSelector({ value, onChange }: { value?: string | null; onChange: (id: string | null) => void }) {
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    let mounted = true
    apiFetch('/api/admin/team-members', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.resolve({ teamMembers: [] })))
      .then((data) => {
        if (!mounted) return
        const list = Array.isArray(data)
          ? (data as unknown[])
          : ((data?.teamMembers || data?.members || []) as unknown[])
        const mapped = list
          .map<Member | null>((m) => {
            const obj = m as { id?: string; name?: string; fullName?: string; email?: string; title?: string }
            const id = obj.id || obj.email || ''
            const name = obj.name || obj.fullName || obj.email || 'Unknown'
            if (!id) return null
            const member: Member = { id, name, email: obj.email, title: obj.title }
            return member
          })
          .filter((v): v is Member => v !== null)
        setMembers(mapped)
      })
      .catch(() => {})
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

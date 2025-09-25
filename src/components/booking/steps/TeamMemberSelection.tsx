"use client"


import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export type TeamMember = {
  id: string
  name: string
  email?: string | null
  title?: string | null
  isAvailable?: boolean
}

export type TeamMemberSelectionProps = {
  serviceId?: string | null
  value?: string | null
  onChange?: (teamMemberId: string | null) => void
}

export default function TeamMemberSelection({ serviceId, value, onChange }: TeamMemberSelectionProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return members
    return members.filter(m => (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q) || (m.title || '').toLowerCase().includes(q))
  }, [members, query])

  useEffect(() => {
    let active = true
    async function load() {
      if (!serviceId) return
      setLoading(true)
      try {
        // Prefer admin endpoint when the current user has permissions; gracefully fallback to empty list on 401
        const res = await apiFetch('/api/admin/team-members')
        if (!res.ok) throw new Error('unauthorized or failed')
        const json = await res.json().catch(() => null as any)
        const list: TeamMember[] = Array.isArray(json?.teamMembers) ? json.teamMembers : []
        if (active) setMembers(list)
      } catch {
        // Fallback: leave list empty; UI will offer "No preference" only
        if (active) setMembers([])
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [serviceId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a Team Member (optional)</CardTitle>
        <p className="text-gray-600">Choose a preferred specialist or continue with no preference.</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="tm-search">Search</Label>
            <Input id="tm-search" placeholder="Search by name, email, or title" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div>
            <Button type="button" variant="outline" onClick={() => onChange?.(null)} disabled={value == null}>
              No preference
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {loading && (
            <div className="col-span-2 text-sm text-gray-500">Loading team members…</div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="col-span-2 text-sm text-gray-500">No team members available or you do not have permission to view them.</div>
          )}
          {filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange?.(m.id)}
              className={`text-left p-4 border rounded-lg transition-all ${value === m.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{m.name}</div>
                  <div className="text-xs text-gray-600 truncate">{m.title || m.email}</div>
                </div>
                {m.isAvailable === false ? (
                  <span className="text-xs text-red-600">Unavailable</span>
                ) : (
                  <span className="text-xs text-green-600">Available</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

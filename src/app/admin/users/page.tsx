"use client"
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { usePermissions } from '@/lib/use-permissions'

interface UserStats {
  total: number
  clients: number
  staff: number
  admins: number
  newThisMonth: number
  growth: number
  topUsers: Array<{ id: string; name: string | null; email: string; bookings: number }>
}

export default function AdminUsersPage() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const perms = usePermissions()
  const [users, setUsers] = useState<Array<{ id: string; name: string | null; email: string; role: 'ADMIN'|'STAFF'|'CLIENT'; createdAt: string }>>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [audits, setAudits] = useState<Array<{ id: string; message: string; checkedAt: string }>>([])
  const [auditsLoading, setAuditsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch('/api/admin/stats/users')
        if (res.ok) setStats(await res.json())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await apiFetch('/api/admin/users')
        if (res.ok) {
          const data = await res.json()
          setUsers(Array.isArray(data?.users) ? data.users : [])
        }
      } finally {
        setUsersLoading(false)
      }
    }
    loadUsers()
  }, [])

  useEffect(() => {
    async function loadAudits() {
      try {
        const res = await apiFetch('/api/health/logs?service=AUDIT&limit=10')
        if (res.ok) {
          const data = await res.json()
          setAudits(Array.isArray(data) ? data : [])
        }
      } finally {
        setAuditsLoading(false)
      }
    }
    loadAudits()
  }, [])

  const updateRole = async (userId: string, role: 'ADMIN'|'STAFF'|'CLIENT') => {
    try {
      const res = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: data.user?.role ?? role } : u))
      }
    } catch (e) {
      console.error('Failed to update role', e)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="h-6 w-6 mr-2 text-blue-600" /> Users
          </h1>
          <p className="text-gray-600 mt-2">Manage user overview and activity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader><CardTitle className="text-sm">Total Users</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats?.total ?? 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Clients</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats?.clients ?? 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Staff</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats?.staff ?? 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Admins</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats?.admins ?? 0}</div></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Clients by Bookings</CardTitle>
            <CardDescription>Most active clients</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.topUsers?.length ? (
              <div className="divide-y divide-gray-100">
                {stats.topUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium text-gray-900">{u.name || 'Unnamed'}</div>
                      <div className="text-sm text-gray-600">{u.email}</div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">{u.bookings} bookings</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No user data available.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View users and update roles</CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (<div key={i} className="bg-gray-200 rounded-lg h-24" />))}
              </div>
            ) : users.length ? (
              <div className="divide-y divide-gray-100">
                {users.map(u => (
                  <div key={u.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{u.name || 'Unnamed'}</div>
                      <div className="text-sm text-gray-600">{u.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-gray-100 text-gray-800">{u.role}</Badge>
                      {perms.canManageUsers && (
                        <Select value={u.role} onValueChange={(val) => updateRole(u.id, val as 'ADMIN'|'STAFF'|'CLIENT')}>
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Change role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CLIENT">Client</SelectItem>
                            <SelectItem value="STAFF">Staff</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No users found.</div>
            )}
            {perms.canManageUsers && (
              <div className="mt-4 text-xs text-gray-500">Role changes require Admin privileges.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Admin Activity</CardTitle>
            <CardDescription>Latest audit events</CardDescription>
          </CardHeader>
          <CardContent>
            {auditsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (<div key={i} className="bg-gray-200 rounded-lg h-16" />))}
              </div>
            ) : audits.length ? (
              <div className="divide-y divide-gray-100">
                {audits.map(a => {
                  let parsed: any = {}
                  try { parsed = JSON.parse(a.message) } catch {}
                  return (
                    <div key={a.id} className="py-3 text-sm text-gray-700 flex items-center justify-between">
                      <div className="truncate mr-4">
                        <span className="font-medium text-gray-900">{parsed.action || 'action'}</span>
                        {parsed.targetId && <span className="ml-2 text-gray-500">target: {parsed.targetId}</span>}
                      </div>
                      <div className="text-xs text-gray-500">{new Date(a.checkedAt).toLocaleString()}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-gray-500">No audit events.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

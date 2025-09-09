"use client"
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
  const [users, setUsers] = useState<Array<{ id: string; name: string | null; email: string; role?: 'ADMIN' | 'STAFF' | 'CLIENT'; createdAt: string }>>([])
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'ADMIN' | 'STAFF' | 'CLIENT'>('all')

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, usersRes] = await Promise.all([
          apiFetch('/api/admin/stats/users'),
          apiFetch(`/api/admin/users?limit=50${q ? `&q=${encodeURIComponent(q)}` : ''}${roleFilter !== 'all' ? `&role=${roleFilter}` : ''}`)
        ])
        if (statsRes.ok) setStats(await statsRes.json())
        if (usersRes.ok) {
          const data = await usersRes.json()
          setUsers(data.users || [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [q, roleFilter])

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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>Search and manage user roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <Input placeholder="Search by name or email" value={q} onChange={e => setQ(e.target.value)} />
              <select className="border rounded px-2 py-2 text-sm" value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)}>
                <option value="all">All Roles</option>
                <option value="ADMIN">Admins</option>
                <option value="STAFF">Staff</option>
                <option value="CLIENT">Clients</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-600">
                    <th className="py-2">Name</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Joined</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t">
                      <td className="py-2">{u.name || 'Unnamed'}</td>
                      <td className="py-2">{u.email}</td>
                      <td className="py-2"><span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs">{u.role}</span></td>
                      <td className="py-2">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="py-2"><UserRoleActions id={u.id} current={u.role || 'CLIENT'} onUpdated={() => { /* refresh */ setQ(x => x) }} /></td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={5} className="text-gray-500 py-6 text-center">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

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
    </div>
  )
}

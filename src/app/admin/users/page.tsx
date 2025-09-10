"use client"
import { useEffect, useState, useMemo, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Users,
  Search,
  Download,
  RefreshCw,
  Eye,
  Loader2
} from 'lucide-react'
import { usePermissions } from '@/lib/use-permissions'

// Types derived from our API responses
interface UserStats {
  total: number
  clients: number
  staff: number
  admins: number
  newThisMonth?: number
  growth?: number
  activeUsers?: number
  topUsers?: Array<{ id: string; name: string | null; email: string; bookings?: number; bookingsCount?: number; createdAt?: string }>
}

interface UserItem {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'STAFF' | 'CLIENT'
  createdAt: string
}

interface HealthLog {
  id: string
  checkedAt: string
  message?: string | null
}

const StatsCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardHeader className="space-y-0 pb-2">
      <div className="h-4 bg-gray-200 rounded w-20" />
    </CardHeader>
    <CardContent>
      <div className="h-8 bg-gray-200 rounded w-16 mb-1" />
      <div className="h-3 bg-gray-200 rounded w-24" />
    </CardContent>
  </Card>
)

const UserRowSkeleton = () => (
  <div className="animate-pulse flex items-center justify-between p-4 bg-white border rounded-lg">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-gray-200 rounded-full" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="h-3 bg-gray-200 rounded w-48" />
      </div>
    </div>
    <div className="hidden sm:block space-y-1">
      <div className="h-3 bg-gray-200 rounded w-16" />
      <div className="h-3 bg-gray-200 rounded w-12" />
    </div>
  </div>
)

export default function AdminUsersPage() {
  const perms = usePermissions()

  // Data state
  const [stats, setStats] = useState<UserStats | null>(null)
  const [users, setUsers] = useState<UserItem[]>([])
  const [activity, setActivity] = useState<HealthLog[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'STAFF' | 'CLIENT'>('ALL')
  const [selected, setSelected] = useState<UserItem | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Loaders
  const loadStats = useCallback(async () => {
    try {
      setErrorMsg(null)
      const res = await apiFetch('/api/admin/stats/users')
      if (!res.ok) throw new Error(`Failed to load stats (${res.status})`)
      const data = (await res.json()) as UserStats
      setStats(data)
    } catch (e) {
      console.error(e)
      setStats({ total: 0, clients: 0, staff: 0, admins: 0 })
      setErrorMsg('Unable to load user statistics')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/users')
      if (!res.ok) throw new Error(`Failed to load users (${res.status})`)
      const data = await res.json()
      const list = Array.isArray(data?.users) ? (data.users as UserItem[]) : []
      setUsers(list)
    } catch (e) {
      console.error(e)
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }, [])

  const loadActivity = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/activity?type=AUDIT&limit=20')
      if (!res.ok) throw new Error(`Failed to load activity (${res.status})`)
      const list = (await res.json()) as HealthLog[] | unknown
      setActivity(Array.isArray(list) ? (list as HealthLog[]) : [])
    } catch (e) {
      console.error(e)
      setActivity([])
    } finally {
      setActivityLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    loadUsers()
    loadActivity()
  }, [loadStats, loadUsers, loadActivity])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.allSettled([loadStats(), loadUsers(), loadActivity()])
    } finally {
      setRefreshing(false)
    }
  }, [loadStats, loadUsers, loadActivity])

  const exportUsers = useCallback(async () => {
    setExporting(true)
    try {
      const res = await apiFetch('/api/admin/export?entity=users&format=csv')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      setErrorMsg('Export failed')
    } finally {
      setExporting(false)
    }
  }, [])

  const updateUserRole = useCallback(async (userId: string, newRole: 'ADMIN'|'STAFF'|'CLIENT') => {
    const original = users.find(u => u.id === userId)
    if (!original) return
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: newRole } : u)))
    try {
      const res = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      await loadActivity()
    } catch (e) {
      console.error('Role update failed', e)
      setUsers(prev => prev.map(u => (u.id === userId ? (original as UserItem) : u)))
      setErrorMsg('Failed to update role')
    }
  }, [users, loadActivity])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users
      .filter(u => (roleFilter === 'ALL' ? true : u.role === roleFilter))
      .filter(u => !q || (u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [users, roleFilter, search])

  const formatDate = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const parseAudit = (msg?: string | null) => {
    try {
      if (!msg) return { action: 'event' }
      const json = JSON.parse(msg) as { action?: string; targetId?: string; details?: unknown }
      return { action: json.action || 'event', targetId: json.targetId }
    } catch {
      return { action: 'event' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (<StatsCardSkeleton key={i} />))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {errorMsg && (
          <div className="mb-6 border border-red-200 bg-red-50 text-red-800 rounded-md p-3 text-sm">
            {errorMsg}
          </div>
        )}

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="h-8 w-8 mr-3 text-blue-600" />
              User Management
            </h1>
            <p className="text-gray-600 mt-2">Manage users, roles, and view activity</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
            {(perms.canViewAnalytics || perms.canManageUsers) && (
              <Button variant="outline" onClick={exportUsers} disabled={exporting} className="flex items-center gap-2">
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {exporting ? 'Exporting…' : 'Export'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
              {typeof stats?.growth === 'number' && (
                <p className="text-xs text-muted-foreground">{stats.growth >= 0 ? `+${stats.growth}%` : `${stats.growth}%`} MoM</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.clients ?? 0}</div>
              <p className="text-xs text-muted-foreground">Active clients</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.staff ?? 0}</div>
              <p className="text-xs text-muted-foreground">Team members</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.admins ?? 0}</div>
              <p className="text-xs text-muted-foreground">Full access</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.newThisMonth ?? 0}</div>
              <p className="text-xs text-muted-foreground">Recent signups</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
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
                        <div className="font-medium text-gray-900">{u.name || 'Unnamed User'}</div>
                        <div className="text-sm text-gray-600">{u.email}</div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {(u.bookings ?? u.bookingsCount ?? 0)} bookings
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No user performance data.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Directory</CardTitle>
              <CardDescription>Search, filter and update roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" className="pl-9" />
                </div>
                <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {usersLoading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (<UserRowSkeleton key={i} />))}</div>
              ) : filteredUsers.length ? (
                <div className="space-y-2">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm w-full">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {(u.name || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate max-w-[220px] sm:max-w-[260px] md:max-w-[320px]">{u.name || 'Unnamed User'}</div>
                          <div className="text-sm text-gray-600 truncate max-w-[220px] sm:max-w-[260px] md:max-w-[320px]">{u.email}</div>
                          <div className="text-xs text-gray-400 truncate">Joined {formatDate(u.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
                        <Badge className="bg-gray-100 text-gray-800">{u.role}</Badge>
                        {perms.canManageUsers && (
                          <Select value={u.role} onValueChange={(val) => updateUserRole(u.id, val as 'ADMIN'|'STAFF'|'CLIENT')}>
                            <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CLIENT">Client</SelectItem>
                              <SelectItem value="STAFF">Staff</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => { setSelected(u); setDetailsOpen(true) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No users found.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Admin Activity</CardTitle>
              <CardDescription>Latest audit events</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="bg-gray-200 rounded-lg h-16" />))}
                </div>
              ) : activity.length ? (
                <div className="divide-y divide-gray-100">
                  {activity.map(log => {
                    const a = parseAudit(log.message)
                    return (
                      <div key={log.id} className="py-3 text-sm text-gray-700 flex items-center justify-between">
                        <div className="truncate mr-4">
                          <span className="font-medium text-gray-900">{a.action}</span>
                          {a.targetId && <span className="ml-2 text-gray-500">target: {a.targetId}</span>}
                        </div>
                        <div className="text-xs text-gray-500">{new Date(log.checkedAt).toLocaleString()}</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No audit events.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-2">
              <div className="text-sm"><span className="text-gray-500">Name:</span> <span className="text-gray-900">{selected.name || 'Unnamed User'}</span></div>
              <div className="text-sm"><span className="text-gray-500">Email:</span> <span className="text-gray-900">{selected.email}</span></div>
              <div className="text-sm"><span className="text-gray-500">Role:</span> <span className="text-gray-900">{selected.role}</span></div>
              <div className="text-sm"><span className="text-gray-500">Joined:</span> <span className="text-gray-900">{formatDate(selected.createdAt)}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

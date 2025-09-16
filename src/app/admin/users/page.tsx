"use client"
import { useEffect, useState, useMemo, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users,
  Search,
  Download,
  RefreshCw,
  Eye,
  Loader2,
  Edit3,
  UserX,
  UserCheck,
  Clock,
  Mail,
  Phone,
  Building,
  Calendar,
  Activity as ActivityIcon,
  Shield,
  Ban
} from 'lucide-react'
import { usePermissions } from '@/lib/use-permissions'

// Enhanced types
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
  role: 'ADMIN' | 'TEAM_MEMBER' | 'TEAM_LEAD' | 'STAFF' | 'CLIENT'
  createdAt: string
  lastLoginAt?: string
  isActive?: boolean
  phone?: string
  company?: string
  totalBookings?: number
  totalRevenue?: number
  avatar?: string
  location?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  permissions?: string[]
  notes?: string
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

  // Activity state for dialog (lazy)
  const [activity, setActivity] = useState<HealthLog[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityError, setActivityError] = useState<string | null>(null)

  // UI state
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'STAFF' | 'CLIENT'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ALL')
  
  // Profile dialog state
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview'|'details'|'activity'|'settings'>('overview')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<UserItem>>({})
  const [updating, setUpdating] = useState(false)
  
  // Status change state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusAction, setStatusAction] = useState<{ action: 'activate' | 'deactivate' | 'suspend', user: UserItem } | null>(null)
  
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

  const loadUserActivity = useCallback(async (userId: string) => {
    setActivityLoading(true)
    setActivityError(null)
    try {
      let res = await apiFetch(`/api/admin/activity?userId=${encodeURIComponent(userId)}&limit=20`)
      if (!res.ok) {
        res = await apiFetch('/api/admin/activity?type=AUDIT&limit=20')
      }
      if (!res.ok) throw new Error(`Failed to load activity (${res.status})`)
      const list = (await res.json()) as unknown
      setActivity(Array.isArray(list) ? (list as HealthLog[]) : [])
    } catch (err) {
      console.error(err)
      setActivity([])
      setActivityError('Unable to load activity')
    } finally {
      setActivityLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    loadUsers()
  }, [loadStats, loadUsers])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.allSettled([loadStats(), loadUsers()])
    } finally {
      setRefreshing(false)
    }
  }, [loadStats, loadUsers])

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
    } catch (e) {
      console.error('Role update failed', e)
      setUsers(prev => prev.map(u => (u.id === userId ? (original as UserItem) : u)))
      setErrorMsg('Failed to update role')
    }
  }, [users])

  // New user profile functions
  const openUserProfile = useCallback((user: UserItem) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      company: user.company || '',
      location: user.location || '',
      notes: user.notes || ''
    })
    setEditMode(false)
    setActiveTab('overview')
    setProfileOpen(true)
    setActivity([])
    setActivityError(null)
  }, [])

  const handleEditUser = useCallback(async () => {
    if (!selectedUser || !editForm) return
    
    setUpdating(true)
    try {
      const res = await apiFetch(`/api/admin/users/${encodeURIComponent(selectedUser.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      
      if (!res.ok) throw new Error(`Failed to update user (${res.status})`)
      
      const updatedUser = await res.json()
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...updatedUser } : u))
      setSelectedUser(prev => prev ? { ...prev, ...updatedUser } : null)
      setEditMode(false)
      
    } catch (e) {
      console.error('User update failed', e)
      setErrorMsg('Failed to update user information')
    } finally {
      setUpdating(false)
    }
  }, [selectedUser, editForm])

  const handleStatusChange = useCallback(async () => {
    if (!statusAction) return
    
    const { action, user } = statusAction
    let newStatus: string
    
    switch (action) {
      case 'activate':
        newStatus = 'ACTIVE'
        break
      case 'deactivate':
        newStatus = 'INACTIVE'
        break
      case 'suspend':
        newStatus = 'SUSPENDED'
        break
      default:
        return
    }
    
    setUpdating(true)
    try {
      const res = await apiFetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!res.ok) throw new Error(`Failed to update user status (${res.status})`)
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === user.id 
          ? { ...u, status: newStatus as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' }
          : u
      ))
      
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser(prev => prev ? { ...prev, status: newStatus as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' } : null)
      }
      
      setStatusDialogOpen(false)
      setStatusAction(null)
      
    } catch (e) {
      console.error('Status update failed', e)
      setErrorMsg('Failed to update user status')
    } finally {
      setUpdating(false)
    }
  }, [statusAction, selectedUser])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users
      .filter(u => (roleFilter === 'ALL' ? true : u.role === roleFilter))
      .filter(u => (statusFilter === 'ALL' ? true : (u.status || 'ACTIVE') === statusFilter))
      .filter(u => !q || (u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.company?.toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [users, roleFilter, statusFilter, search])

  const formatDate = (iso?: string) => {
    if (!iso) return 'Never'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return 'Invalid date'
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const daysSince = (iso?: string) => {
    if (!iso) return 0
    const start = new Date(iso).getTime()
    if (Number.isNaN(start)) return 0
    const now = Date.now()
    return Math.max(0, Math.floor((now - start) / (24 * 60 * 60 * 1000)))
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'TEAM_MEMBER':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'TEAM_LEAD':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'STAFF':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'CLIENT':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  useEffect(() => {
    if (profileOpen && activeTab === 'activity' && selectedUser && !activityLoading && activity.length === 0 && !activityError) {
      void loadUserActivity(selectedUser.id)
    }
  }, [profileOpen, activeTab, selectedUser, activityLoading, activity.length, activityError, loadUserActivity])

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
            <button onClick={() => setErrorMsg(null)} className="ml-2 text-red-600 hover:text-red-800">×</button>
          </div>
        )}

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="h-8 w-8 mr-3 text-blue-600" />
              User Management
            </h1>
            <p className="text-gray-600 mt-2">Manage users, roles, and monitor activity</p>
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

        {/* Statistics Cards */}
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
          {/* Top Clients */}
          <Card className="lg:col-span-1">
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

          {/* User Directory */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>User Directory</CardTitle>
              <CardDescription>Search, filter and manage users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    placeholder="Search by name, email, or company" 
                    className="pl-9" 
                  />
                </div>
                <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                    <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-1">
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
                          <div className="min-w-0 flex-1">
                            <button
                              onClick={() => openUserProfile(u)}
                              className="font-medium text-gray-900 hover:text-blue-600 truncate max-w-[220px] sm:max-w-[260px] md:max-w-[320px] text-left"
                            >
                              {u.name || 'Unnamed User'}
                            </button>
                            <div className="text-sm text-gray-600 truncate max-w-[220px] sm:max-w-[260px] md:max-w-[320px]">{u.email}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="text-xs text-gray-400">Joined {formatDate(u.createdAt)}</div>
                              {u.company && <div className="text-xs text-gray-400">• {u.company}</div>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge className={getStatusColor(u.status)}>
                            {u.status || 'ACTIVE'}
                          </Badge>
                          <Badge className={getRoleColor(u.role)}>
                            {u.role}
                          </Badge>
                          {perms.canManageUsers && (
                            <Select value={u.role} onValueChange={(val) => updateUserRole(u.id, val as 'ADMIN'|'TEAM_LEAD'|'TEAM_MEMBER'|'STAFF'|'CLIENT')}>
                              <SelectTrigger className="w-28 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CLIENT">Client</SelectItem>
                                <SelectItem value="STAFF">Staff</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => openUserProfile(u)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm py-6 text-center">No users found matching your criteria.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced User Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={(open) => {
        setProfileOpen(open)
        if (!open) {
          setEditMode(false)
          setActiveTab('overview')
        }
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {selectedUser ? (selectedUser.name || selectedUser.email).charAt(0).toUpperCase() : ''}
              </div>
              {activeTab === 'details' && editMode ? 'Edit User Profile' : 'User Profile'}
            </DialogTitle>
            <DialogDescription>
              {activeTab === 'details' && editMode ? 'Update user information and settings' : 'View detailed user information and manage account'}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="flex-1 overflow-y-auto pr-1">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* OVERVIEW */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="rounded-lg overflow-hidden border">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                          {(selectedUser.name || selectedUser.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-lg font-semibold text-gray-900 truncate">{selectedUser.name || 'Unnamed User'}</div>
                          <div className="text-sm text-gray-600 truncate">{selectedUser.email}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getRoleColor(selectedUser.role)}>{selectedUser.role}</Badge>
                            <Badge className={getStatusColor(selectedUser.status)}>{selectedUser.status || 'ACTIVE'}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white border rounded-md p-3">
                        <div className="text-xs text-gray-500">Total Bookings</div>
                        <div className="text-xl font-bold text-gray-900">{selectedUser.totalBookings ?? 0}</div>
                      </div>
                      <div className="bg-white border rounded-md p-3">
                        <div className="text-xs text-gray-500">Total Revenue</div>
                        <div className="text-xl font-bold text-gray-900">${(selectedUser.totalRevenue ?? 0).toLocaleString()}</div>
                      </div>
                      <div className="bg-white border rounded-md p-3">
                        <div className="text-xs text-gray-500">Days Active</div>
                        <div className="text-xl font-bold text-gray-900">{daysSince(selectedUser.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Email</div>
                          <div className="text-sm text-gray-600">{selectedUser.email}</div>
                        </div>
                      </div>
                      {selectedUser.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">Phone</div>
                            <div className="text-sm text-gray-600">{selectedUser.phone}</div>
                          </div>
                        </div>
                      )}
                      {selectedUser.company && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">Company</div>
                            <div className="text-sm text-gray-600">{selectedUser.company}</div>
                          </div>
                        </div>
                      )}
                      {selectedUser.location && (
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900">Location</div>
                            <div className="text-sm text-gray-600">{selectedUser.location}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Joined</div>
                          <div className="text-sm text-gray-600">{formatDate(selectedUser.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Last Login</div>
                          <div className="text-sm text-gray-600">{formatDate(selectedUser.lastLoginAt)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Role</div>
                          <Badge className={getRoleColor(selectedUser.role)}>{selectedUser.role}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ActivityIcon className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Status</div>
                          <Badge className={getStatusColor(selectedUser.status)}>
                            {selectedUser.status || 'ACTIVE'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedUser.notes && (
                    <div className="pt-4 border-t">
                      <div className="text-sm font-medium text-gray-900 mb-2">Notes</div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        {selectedUser.notes}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* DETAILS */}
                <TabsContent value="details" className="space-y-4 mt-4">
                  {editMode ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={editForm.email || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter email address"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            value={editForm.phone || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">Company</Label>
                          <Input
                            id="company"
                            value={editForm.company || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                            placeholder="Enter company name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={editForm.location || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Enter location"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={editForm.notes || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Add any notes about this user..."
                          rows={4}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <div className="text-sm text-gray-500">Full Name</div>
                          <div className="text-sm font-medium text-gray-900">{selectedUser.name || '—'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Email Address</div>
                          <div className="text-sm font-medium text-gray-900">{selectedUser.email}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Phone</div>
                          <div className="text-sm font-medium text-gray-900">{selectedUser.phone || '—'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Company</div>
                          <div className="text-sm font-medium text-gray-900">{selectedUser.company || '—'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Location</div>
                          <div className="text-sm font-medium text-gray-900">{selectedUser.location || '—'}</div>
                        </div>
                      </div>
                      {selectedUser.notes && (
                        <div className="pt-2 border-t">
                          <div className="text-sm text-gray-500 mb-1">Notes</div>
                          <div className="text-sm text-gray-700">{selectedUser.notes}</div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* ACTIVITY */}
                <TabsContent value="activity" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="text-sm text-gray-500">Recent activity for this user</div>
                    {activityLoading ? (
                      <div className="text-sm text-gray-500">Loading activity…</div>
                    ) : activityError ? (
                      <div className="text-sm text-red-600">{activityError}</div>
                    ) : activity.length ? (
                      <div className="space-y-2">
                        {activity.map((a) => {
                          let title = a.message || 'Activity'
                          let date = formatDate(a.checkedAt)
                          let detailsStr = ''
                          try {
                            const obj = typeof a.message === 'string' ? JSON.parse(a.message) : a.message
                            if (obj && obj.action) {
                              const act = obj.action
                              const label = act === 'user.profile.update' ? 'Profile updated'
                                : act === 'user.role.update' ? 'Role updated'
                                : act.replace(/\./g, ' ')
                              title = label

                              if (obj.details) {
                                if (obj.details.updatedFields) {
                                  detailsStr = Array.isArray(obj.details.updatedFields) ? obj.details.updatedFields.join(', ') : String(obj.details.updatedFields)
                                } else if (typeof obj.details === 'object') {
                                  // show a short summary for common fields
                                  const keys = Object.keys(obj.details)
                                  detailsStr = keys.map(k => `${k}: ${JSON.stringify(obj.details[k])}`).join(', ')
                                } else {
                                  detailsStr = String(obj.details)
                                }
                              }

                              date = formatDate(obj.at || a.checkedAt)
                            }
                          } catch {
                            // not JSON — keep original message
                          }

                          return (
                            <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                              <div>
                                <div className="text-sm font-medium">{title}{detailsStr ? ` — ${detailsStr}` : ''}</div>
                                <div className="text-xs text-gray-500">{date}</div>
                              </div>
                              <Badge variant="outline">Audit</Badge>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <div className="text-sm font-medium">Account created</div>
                            <div className="text-xs text-gray-500">{formatDate(selectedUser.createdAt)}</div>
                          </div>
                          <Badge variant="outline">System</Badge>
                        </div>
                        {selectedUser.lastLoginAt && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div>
                              <div className="text-sm font-medium">Last login</div>
                              <div className="text-xs text-gray-500">{formatDate(selectedUser.lastLoginAt)}</div>
                            </div>
                            <Badge variant="outline">Login</Badge>
                          </div>
                        )}
                        <div className="text-xs text-gray-400 text-center py-2">
                          More detailed activity logs available in audit section
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* SETTINGS */}
                <TabsContent value="settings" className="space-y-4 mt-4">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Account Status</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <div className="text-sm font-medium">Current Status</div>
                            <div className="text-xs text-gray-500">User account status</div>
                          </div>
                          <Badge className={getStatusColor(selectedUser.status)}>
                            {selectedUser.status || 'ACTIVE'}
                          </Badge>
                        </div>
                        {perms.canManageUsers && (
                          <div className="flex gap-2 pt-2">
                            {(selectedUser.status === 'INACTIVE' || selectedUser.status === 'SUSPENDED') && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setStatusAction({ action: 'activate', user: selectedUser })
                                  setStatusDialogOpen(true)
                                }}
                                className="flex items-center gap-1"
                              >
                                <UserCheck className="h-3 w-3" />
                                Activate
                              </Button>
                            )}
                            {selectedUser.status !== 'INACTIVE' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setStatusAction({ action: 'deactivate', user: selectedUser })
                                  setStatusDialogOpen(true)
                                }}
                                className="flex items-center gap-1"
                              >
                                <UserX className="h-3 w-3" />
                                Deactivate
                              </Button>
                            )}
                            {selectedUser.status !== 'SUSPENDED' && (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => {
                                  setStatusAction({ action: 'suspend', user: selectedUser })
                                  setStatusDialogOpen(true)
                                }}
                                className="flex items-center gap-1"
                              >
                                <Ban className="h-3 w-3" />
                                Suspend
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Permissions</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <div className="text-sm font-medium">User Role</div>
                            <div className="text-xs text-gray-500">Determines access level</div>
                          </div>
                          <Badge className={getRoleColor(selectedUser.role)}>
                            {selectedUser.role}
                          </Badge>
                        </div>
                        {selectedUser.permissions && selectedUser.permissions.length > 0 && (
                          <div className="p-3 bg-gray-50 rounded-md">
                            <div className="text-sm font-medium mb-2">Custom Permissions</div>
                            <div className="flex flex-wrap gap-1">
                              {selectedUser.permissions.map((perm, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {perm}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {activeTab === 'details' && !editMode && perms.canManageUsers && (
                <Button variant="outline" onClick={() => setEditMode(true)} className="flex items-center gap-1">
                  <Edit3 className="h-3 w-3" />
                  Edit
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {activeTab === 'details' && editMode ? (
                <>
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditUser} disabled={updating}>
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setProfileOpen(false)}>
                  Close
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusAction?.action === 'activate' && 'Activate User Account'}
              {statusAction?.action === 'deactivate' && 'Deactivate User Account'}
              {statusAction?.action === 'suspend' && 'Suspend User Account'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusAction?.action === 'activate' && 
                `Are you sure you want to activate ${statusAction.user.name || statusAction.user.email}'s account? They will regain access to their account.`
              }
              {statusAction?.action === 'deactivate' && 
                `Are you sure you want to deactivate ${statusAction.user.name || statusAction.user.email}'s account? They will lose access but their data will be preserved.`
              }
              {statusAction?.action === 'suspend' && 
                `Are you sure you want to suspend ${statusAction.user.name || statusAction.user.email}'s account? This action should only be used for policy violations.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={updating}
              className={
                statusAction?.action === 'suspend' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : statusAction?.action === 'activate'
                  ? 'bg-green-600 hover:bg-green-700'
                  : ''
              }
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  {statusAction?.action === 'activate' && 'Activate User'}
                  {statusAction?.action === 'deactivate' && 'Deactivate User'}
                  {statusAction?.action === 'suspend' && 'Suspend User'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
